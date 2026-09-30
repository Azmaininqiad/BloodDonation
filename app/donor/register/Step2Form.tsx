'use client'

import { UseFormReturn } from 'react-hook-form'
import type { DonorStep2, DonorStep2Input } from '@/lib/validation/donor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { LocationPicker } from '@/components/map/LocationPicker'
import { useState } from 'react'

interface Props {
  form: UseFormReturn<DonorStep2Input, unknown, DonorStep2>
  onNext: () => void
  onBack: () => void
}

export function Step2Form({ form, onNext, onBack }: Props) {
  const { register, setValue, watch, formState: { errors } } = form
  const [neverDonated, setNeverDonated] = useState(watch('never_donated') ?? false)

  return (
    <form onSubmit={onNext} className="space-y-4">
      <div>
        <Label htmlFor="last_donated">Last donation date</Label>
        <Input
          id="last_donated"
          type="date"
          {...register('last_donated')}
          disabled={neverDonated}
          className="mt-1"
        />
        {errors.last_donated && <p className="text-red-600 text-xs mt-1">{errors.last_donated.message}</p>}
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="never_donated"
            checked={neverDonated}
            onCheckedChange={(checked) => {
              setNeverDonated(!!checked)
              setValue('never_donated', !!checked)
              if (checked) setValue('last_donated', '')
            }}
          />
          <Label htmlFor="never_donated" className="text-sm font-normal cursor-pointer">
            I have never donated
          </Label>
        </div>
      </div>

      <div>
        <Label>Your location *</Label>
        <p className="text-xs text-black mb-2">
          Used to find patients near you. Your exact location is never shown publicly.
        </p>
        <LocationPicker
          lat={watch('latitude') ?? parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '23.8103')}
          lng={watch('longitude') ?? parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '90.4125')}
          onChange={(lat, lng) => {
            setValue('latitude', lat)
            setValue('longitude', lng)
          }}
        />
        {(errors.latitude || errors.longitude) && (
          <p className="text-red-600 text-xs mt-1">Location is required</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Address (optional)</Label>
        <Input id="address" {...register('address')} className="mt-1" placeholder="House, street" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="area">Area / Neighbourhood (optional)</Label>
          <Input id="area" {...register('area')} className="mt-1" placeholder="e.g. Gulshan" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register('city')} className="mt-1" defaultValue="Dhaka" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
          Next
        </Button>
      </div>
    </form>
  )
}
