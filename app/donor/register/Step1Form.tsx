'use client'

import { UseFormReturn } from 'react-hook-form'
import type { DonorStep1, DonorStep1Input } from '@/lib/validation/donor'
import { ALL_BLOOD_TYPES } from '@/lib/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  form: UseFormReturn<DonorStep1Input, unknown, DonorStep1>
  onNext: () => void
}

export function Step1Form({ form, onNext }: Props) {
  const { register, setValue, watch, formState: { errors } } = form

  return (
    <form onSubmit={onNext} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full name *</Label>
        <Input id="full_name" {...register('full_name')} className="mt-1" autoComplete="name" />
        {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date_of_birth">Date of birth *</Label>
          <Input id="date_of_birth" type="date" {...register('date_of_birth')} className="mt-1" />
          {errors.date_of_birth && <p className="text-red-600 text-xs mt-1">{errors.date_of_birth.message}</p>}
        </div>
        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select onValueChange={(v) => setValue('gender', v as 'male' | 'female' | 'other')} value={watch('gender')}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-red-600 text-xs mt-1">{errors.gender.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="weight_kg">Weight (kg) *</Label>
          <Input
            id="weight_kg"
            type="number"
            step="0.1"
            {...register('weight_kg', { valueAsNumber: true })}
            className="mt-1"
          />
          <p className="text-xs text-black mt-0.5">Minimum 50 kg</p>
          {errors.weight_kg && <p className="text-red-600 text-xs mt-1">{errors.weight_kg.message}</p>}
        </div>
        <div>
          <Label htmlFor="blood_type">Blood type *</Label>
          <Select onValueChange={(v) => setValue('blood_type', v as typeof ALL_BLOOD_TYPES[number])} value={watch('blood_type')}>
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

      <div>
        <Label htmlFor="phone">Phone number *</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          className="mt-1"
          placeholder="e.g. 01712345678"
          autoComplete="tel"
        />
        {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email (optional)</Label>
        <Input id="email" type="email" {...register('email')} className="mt-1" autoComplete="email" />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="preferred_channel">Notification channel</Label>
          <Select
            onValueChange={(v) => setValue('preferred_channel', v as 'sms' | 'whatsapp' | 'email' | 'push')}
            value={watch('preferred_channel') ?? 'sms'}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preferred_language">Language</Label>
          <Select
            onValueChange={(v) => setValue('preferred_language', v as 'en' | 'bn')}
            value={watch('preferred_language') ?? 'en'}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="bn">বাংলা</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
        Next
      </Button>
    </form>
  )
}
