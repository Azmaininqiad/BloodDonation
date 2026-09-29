'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { LocationPicker } from '@/components/map/LocationPicker'
import { ALL_BLOOD_TYPES } from '@/lib/compat'
import type { Database } from '@/types/database'

type Donor = Database['public']['Tables']['donors']['Row']

const schema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().default('Dhaka'),
  preferred_channel: z.enum(['sms', 'whatsapp', 'email', 'push']),
  preferred_language: z.enum(['en', 'bn']),
  show_on_leaderboard: z.boolean(),
  latitude: z.number(),
  longitude: z.number(),
})
type FormData = z.infer<typeof schema>

export function ProfileEditForm({ donor }: { donor: Donor }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: donor.full_name,
      phone: donor.phone,
      email: donor.email ?? '',
      address: donor.address ?? '',
      area: donor.area ?? '',
      city: donor.city,
      preferred_channel: donor.preferred_channel as 'sms' | 'whatsapp' | 'email' | 'push',
      preferred_language: donor.preferred_language as 'en' | 'bn',
      show_on_leaderboard: donor.show_on_leaderboard,
      latitude: donor.latitude,
      longitude: donor.longitude,
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase
      .from('donors')
      .update({
        full_name: data.full_name,
        email: data.email || null,
        address: data.address || null,
        area: data.area || null,
        city: data.city,
        preferred_channel: data.preferred_channel,
        preferred_language: data.preferred_language,
        show_on_leaderboard: data.show_on_leaderboard,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      .eq('id', donor.id)
    if (error) toast.error(error.message)
    else { toast.success('Profile updated'); router.push('/dashboard') }
    setLoading(false)
  }

  async function deleteAccount() {
    if (!confirm('Delete your account? This cannot be undone.')) return
    setDeleteLoading(true)
    // Delete donor row (cascade handles auth user via trigger)
    await supabase.from('donors').delete().eq('id', donor.id)
    await supabase.auth.signOut()
    router.push('/')
    setDeleteLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...register('full_name')} className="mt-1" />
        {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Blood type</Label>
          <Input value={donor.blood_type} disabled className="mt-1 bg-gray-50" />
          <p className="text-xs text-gray-400 mt-0.5">Contact admin to change blood type</p>
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={donor.phone} disabled className="mt-1 bg-gray-50" />
          <p className="text-xs text-gray-400 mt-0.5">Contact admin to change phone</p>
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} className="mt-1" />
      </div>

      <div>
        <Label>Location</Label>
        <LocationPicker
          lat={watch('latitude')}
          lng={watch('longitude')}
          onChange={(lat, lng) => { setValue('latitude', lat); setValue('longitude', lng) }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register('address')} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="area">Area</Label>
          <Input id="area" {...register('area')} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Notification channel</Label>
          <Select value={watch('preferred_channel')} onValueChange={(v) => setValue('preferred_channel', v as 'sms' | 'whatsapp' | 'email' | 'push')}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Language</Label>
          <Select value={watch('preferred_language')} onValueChange={(v) => setValue('preferred_language', v as 'en' | 'bn')}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="bn">বাংলা</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="leaderboard"
          checked={watch('show_on_leaderboard')}
          onCheckedChange={(v) => setValue('show_on_leaderboard', !!v)}
        />
        <Label htmlFor="leaderboard" className="font-normal text-sm cursor-pointer">
          Show my first name on the public leaderboard
        </Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <div className="pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={deleteAccount}
          disabled={deleteLoading}
        >
          {deleteLoading ? 'Deleting…' : 'Delete my account & data'}
        </Button>
      </div>
    </form>
  )
}
