'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { requestSchema, type RequestInput } from '@/lib/validation/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HospitalCombobox } from '@/components/forms/HospitalCombobox'
import { LocationPicker } from '@/components/map/LocationPicker'
import { ALL_BLOOD_TYPES } from '@/lib/compat'

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '23.8103')
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '90.4125')

interface Hospital {
  id: string; name: string; address: string | null; area: string | null
  latitude: number; longitude: number
}

export function NewRequestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [showManualHospital, setShowManualHospital] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      urgency: 'mid',
      units_needed: 1,
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
    },
  })

  function handleHospitalSelect(h: Hospital | null) {
    setHospital(h)
    if (h) {
      setValue('hospital_id', h.id)
      setValue('hospital_name', h.name)
      setValue('hospital_address', h.address ?? '')
      setValue('latitude', h.latitude)
      setValue('longitude', h.longitude)
      setShowManualHospital(false)
    } else {
      setValue('hospital_id', '')
      setShowManualHospital(true)
    }
  }

  async function onSubmit(data: RequestInput) {
    setLoading(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.ok) {
        if (result.error === 'rate_limited') {
          toast.error(result.message ?? 'Too many requests. Please try again later.')
        } else {
          toast.error('Failed to submit request. Please check the form.')
        }
        return
      }
      // Save in localStorage so requester can return
      localStorage.setItem(`request_${result.id}`, result.token)
      toast.success('Request submitted! Notifying nearby donors…')
      router.push(result.status_url)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Honeypot - hidden from humans */}
      <input type="text" {...register('honeypot')} className="hidden" tabIndex={-1} aria-hidden="true" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="patient_gender">Patient gender *</Label>
          <Select onValueChange={(v) => setValue('patient_gender', v as 'male' | 'female' | 'other')}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.patient_gender && <p className="text-red-600 text-xs mt-1">{errors.patient_gender.message}</p>}
        </div>

        <div>
          <Label htmlFor="blood_type">Blood type *</Label>
          <Select onValueChange={(v) => setValue('blood_type', v as typeof ALL_BLOOD_TYPES[number])}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {ALL_BLOOD_TYPES.map((bt) => (
                <SelectItem key={bt} value={bt}>{bt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.blood_type && <p className="text-red-600 text-xs mt-1">{errors.blood_type.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="units_needed">Bags needed *</Label>
          <Select
            defaultValue="1"
            onValueChange={(v) => setValue('units_needed', parseInt(v))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>{n} bag{n > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-0.5">1 bag ≈ 450 ml</p>
          {errors.units_needed && <p className="text-red-600 text-xs mt-1">{errors.units_needed.message}</p>}
        </div>

        <div>
          <Label htmlFor="urgency">Urgency *</Label>
          <Select defaultValue="mid" onValueChange={(v) => setValue('urgency', v as 'high' | 'mid' | 'low')}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 High – within hours</SelectItem>
              <SelectItem value="mid">🟡 Mid – within 1-2 days</SelectItem>
              <SelectItem value="low">🟢 Low – planned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Hospital *</Label>
        <div className="mt-1">
          <HospitalCombobox onSelect={handleHospitalSelect} selected={hospital} />
        </div>
        {errors.hospital_name && <p className="text-red-600 text-xs mt-1">{errors.hospital_name.message}</p>}
      </div>

      {showManualHospital && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <div>
            <Label htmlFor="hospital_name">Hospital name *</Label>
            <Input id="hospital_name" {...register('hospital_name')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="hospital_address">Hospital address</Label>
            <Input id="hospital_address" {...register('hospital_address')} className="mt-1" />
          </div>
          <div>
            <Label>Hospital location on map *</Label>
            <div className="mt-2">
              <LocationPicker
                lat={watch('latitude') ?? DEFAULT_LAT}
                lng={watch('longitude') ?? DEFAULT_LNG}
                onChange={(lat, lng) => { setValue('latitude', lat); setValue('longitude', lng) }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="contact_1">Primary contact number *</Label>
          <Input
            id="contact_1"
            type="tel"
            {...register('contact_1')}
            className="mt-1"
            placeholder="e.g. 01712345678"
          />
          {errors.contact_1 && <p className="text-red-600 text-xs mt-1">{errors.contact_1.message}</p>}
        </div>
        <div>
          <Label htmlFor="contact_2">Secondary contact (optional)</Label>
          <Input
            id="contact_2"
            type="tel"
            {...register('contact_2')}
            className="mt-1"
            placeholder="e.g. 01712345678"
          />
          {errors.contact_2 && <p className="text-red-600 text-xs mt-1">{errors.contact_2.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="patient_name">Patient name (optional)</Label>
          <Input id="patient_name" {...register('patient_name')} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="requester_name">Your name (optional)</Label>
          <Input id="requester_name" {...register('requester_name')} className="mt-1" />
        </div>
      </div>

      <div>
        <Label htmlFor="needed_by">Blood needed by (optional)</Label>
        <Input id="needed_by" type="datetime-local" {...register('needed_by')} className="mt-1" />
      </div>

      <div>
        <Label htmlFor="notes">Additional notes (optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          className="mt-1"
          placeholder="Any other important information for the donor…"
          rows={3}
        />
        {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes.message}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white text-base h-12"
        disabled={loading}
      >
        {loading ? 'Finding donors…' : '🔍 Find donors now'}
      </Button>
    </form>
  )
}
