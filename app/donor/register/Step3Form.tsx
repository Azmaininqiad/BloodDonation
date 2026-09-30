'use client'

import { UseFormReturn } from 'react-hook-form'
import type { DonorStep3, DonorStep3Input } from '@/lib/validation/donor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle } from 'lucide-react'

const QUESTIONS: { key: keyof Omit<DonorStep3, 'consent_given' | 'show_on_leaderboard'>; label: string }[] = [
  { key: 'q_fever',      label: 'Fever, cold, or illness in the last 14 days?' },
  { key: 'q_tattoo',     label: 'Tattoo or piercing in the last 6 months?' },
  { key: 'q_surgery',    label: 'Surgery in the last 6 months?' },
  { key: 'q_medication', label: 'Currently on antibiotics or other medication?' },
  { key: 'q_chronic',    label: 'Chronic disease? (insulin-dependent diabetes, heart disease, hepatitis B/C, HIV, epilepsy, cancer)' },
  { key: 'q_pregnant',   label: 'Pregnant or breastfeeding?' },
]

interface Props {
  form: UseFormReturn<DonorStep3Input, unknown, DonorStep3>
  onNext: () => void
  onBack: () => void
  loading: boolean
}

export function Step3Form({ form, onNext, onBack, loading }: Props) {
  const { register, watch, setValue, formState: { errors } } = form

  const anyYes = QUESTIONS.some((q) => watch(q.key))

  return (
    <form onSubmit={onNext} className="space-y-5">
      <div>
        <h3 className="font-medium text-sm mb-1">Health questionnaire</h3>
        <p className="text-xs text-black mb-3">
          Please answer honestly. Final eligibility is decided by medical staff at the donation site.
        </p>
        <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
          {QUESTIONS.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={key}
                checked={!!watch(key)}
                onCheckedChange={(checked) => setValue(key, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={key} className="text-sm font-normal cursor-pointer leading-snug">
                {label}
              </Label>
            </div>
          ))}
        </div>

        {anyYes && (
          <div className="mt-3 flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Based on your answers, you may not be eligible to donate right now. You can still
              register and update this later from your profile.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent_given"
            {...register('consent_given')}
            onCheckedChange={(checked) => setValue('consent_given', checked as true)}
          />
          <Label htmlFor="consent_given" className="text-sm font-normal cursor-pointer leading-snug">
            I agree to be contacted for blood requests and to share my name and phone number with
            a patient&apos;s family <strong>only after I confirm</strong>. *
          </Label>
        </div>
        {errors.consent_given && (
          <p className="text-red-600 text-xs">{errors.consent_given.message}</p>
        )}

        <div className="flex items-start gap-3">
          <Checkbox
            id="show_on_leaderboard"
            checked={!!watch('show_on_leaderboard')}
            onCheckedChange={(checked) => setValue('show_on_leaderboard', !!checked)}
          />
          <Label htmlFor="show_on_leaderboard" className="text-sm font-normal cursor-pointer">
            Show my first name on the public leaderboard (optional)
          </Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          Back
        </Button>
        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={loading}>
          {loading ? 'Registering…' : 'Complete registration'}
        </Button>
      </div>
    </form>
  )
}
