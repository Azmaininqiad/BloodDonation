'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  donorStep1Schema,
  donorStep2Schema,
  donorStep3Schema,
  toDonorInsert,
  type DonorStep1,
  type DonorStep2,
  type DonorStep3,
  type FullDonor,
} from '@/lib/validation/donor'
import { Step1Form } from './Step1Form'
import { Step2Form } from './Step2Form'
import { Step3Form } from './Step3Form'

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '23.8103')
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '90.4125')

interface Props {
  userId: string
}

export function DonorRegisterWizard({ userId }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [step1Data, setStep1Data] = useState<DonorStep1 | null>(null)
  const [step2Data, setStep2Data] = useState<DonorStep2 | null>(null)

  const form1 = useForm<DonorStep1>({ resolver: zodResolver(donorStep1Schema) })
  const form2 = useForm<DonorStep2>({
    resolver: zodResolver(donorStep2Schema),
    defaultValues: { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, city: 'Dhaka' },
  })
  const form3 = useForm<DonorStep3>({
    resolver: zodResolver(donorStep3Schema),
    defaultValues: {
      q_fever: false,
      q_tattoo: false,
      q_surgery: false,
      q_medication: false,
      q_chronic: false,
      q_pregnant: false,
      show_on_leaderboard: false,
    },
  })

  async function onStep1(data: DonorStep1) {
    setStep1Data(data)
    setStep(2)
  }

  async function onStep2(data: DonorStep2) {
    setStep2Data(data)
    setStep(3)
  }

  async function onStep3(data: DonorStep3) {
    if (!step1Data || !step2Data) return

    const fullData: FullDonor = { ...step1Data, ...step2Data, ...data }
    setLoading(true)

    try {
      const insert = toDonorInsert(fullData, userId)
      const { error } = await supabase.from('donors').insert(insert)
      if (error) throw error

      toast.success('Registration complete! Welcome to BloodConnect.')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Step {step} of 3 –{' '}
            {step === 1 ? 'About you' : step === 2 ? 'Location & history' : 'Health & consent'}
          </CardTitle>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full ${
                  i <= step ? 'bg-red-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && <Step1Form form={form1} onNext={form1.handleSubmit(onStep1)} />}
        {step === 2 && (
          <Step2Form
            form={form2}
            onNext={form2.handleSubmit(onStep2)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Form
            form={form3}
            onNext={form3.handleSubmit(onStep3)}
            onBack={() => setStep(2)}
            loading={loading}
          />
        )}
      </CardContent>
    </Card>
  )
}
