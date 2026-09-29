'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormData {
  name: string; address: string; area: string; city: string
  phone: string; latitude: string; longitude: string
}

export function AdminHospitalForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.from('hospitals').insert({
      name: data.name, address: data.address || null, area: data.area || null,
      city: data.city || 'Dhaka', phone: data.phone || null,
      latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude),
    })
    if (error) toast.error(error.message)
    else { toast.success('Hospital added'); reset(); router.refresh() }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="col-span-2 sm:col-span-3">
        <Label>Name *</Label>
        <Input {...register('name', { required: true })} className="mt-1" />
        {errors.name && <p className="text-red-600 text-xs mt-1">Required</p>}
      </div>
      <div><Label>Address</Label><Input {...register('address')} className="mt-1" /></div>
      <div><Label>Area</Label><Input {...register('area')} className="mt-1" /></div>
      <div><Label>City</Label><Input {...register('city')} defaultValue="Dhaka" className="mt-1" /></div>
      <div><Label>Phone</Label><Input {...register('phone')} className="mt-1" /></div>
      <div>
        <Label>Latitude *</Label>
        <Input {...register('latitude', { required: true })} placeholder="23.7456" className="mt-1" />
        {errors.latitude && <p className="text-red-600 text-xs mt-1">Required</p>}
      </div>
      <div>
        <Label>Longitude *</Label>
        <Input {...register('longitude', { required: true })} placeholder="90.3923" className="mt-1" />
        {errors.longitude && <p className="text-red-600 text-xs mt-1">Required</p>}
      </div>
      <div className="col-span-2 sm:col-span-3">
        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
          {loading ? 'Adding…' : 'Add hospital'}
        </Button>
      </div>
    </form>
  )
}
