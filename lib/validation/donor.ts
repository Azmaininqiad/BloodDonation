import { z } from 'zod'
import { isValidPhone, normalizePhone } from '@/lib/phone'
import { ALL_BLOOD_TYPES } from '@/lib/compat'

const bloodTypeEnum = z.enum(ALL_BLOOD_TYPES as [string, ...string[]])

export const donorStep1Schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((d) => {
      const dob = new Date(d)
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
      return age >= 18 && age <= 65
    }, 'You must be between 18 and 65 years old'),
  gender: z.enum(['male', 'female', 'other']),
  weight_kg: z
    .number({ invalid_type_error: 'Weight is required' })
    .min(50, 'Minimum weight is 50 kg')
    .max(250, 'Weight seems too high'),
  blood_type: bloodTypeEnum,
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(isValidPhone, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  preferred_channel: z.enum(['sms', 'whatsapp', 'email', 'push']).default('sms'),
  preferred_language: z.enum(['en', 'bn']).default('en'),
})

export const donorStep2Schema = z.object({
  last_donated: z.string().optional().or(z.literal('')),
  never_donated: z.boolean().default(false),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().default('Dhaka'),
  latitude: z.number({ required_error: 'Location is required' }),
  longitude: z.number({ required_error: 'Location is required' }),
})

export const donorStep3Schema = z.object({
  q_fever: z.boolean(),
  q_tattoo: z.boolean(),
  q_surgery: z.boolean(),
  q_medication: z.boolean(),
  q_chronic: z.boolean(),
  q_pregnant: z.boolean(),
  consent_given: z.literal(true, { errorMap: () => ({ message: 'Consent is required' }) }),
  show_on_leaderboard: z.boolean().default(false),
})

export const fullDonorSchema = donorStep1Schema.merge(donorStep2Schema).merge(
  z.object({
    q_fever: z.boolean(),
    q_tattoo: z.boolean(),
    q_surgery: z.boolean(),
    q_medication: z.boolean(),
    q_chronic: z.boolean(),
    q_pregnant: z.boolean(),
    consent_given: z.literal(true),
    show_on_leaderboard: z.boolean().default(false),
  })
)

export type DonorStep1 = z.infer<typeof donorStep1Schema>
export type DonorStep2 = z.infer<typeof donorStep2Schema>
export type DonorStep3 = z.infer<typeof donorStep3Schema>
export type FullDonor = z.infer<typeof fullDonorSchema>

/** Transform validated donor data into a DB insert shape */
export function toDonorInsert(data: FullDonor, userId: string) {
  const healthNotes = {
    q_fever: data.q_fever,
    q_tattoo: data.q_tattoo,
    q_surgery: data.q_surgery,
    q_medication: data.q_medication,
    q_chronic: data.q_chronic,
    q_pregnant: data.q_pregnant,
  }
  const selfDeclaredEligible = !Object.values(healthNotes).some(Boolean)

  return {
    user_id: userId,
    full_name: data.full_name,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    weight_kg: data.weight_kg,
    blood_type: data.blood_type,
    phone: normalizePhone(data.phone),
    email: data.email || null,
    last_donated: data.never_donated ? null : (data.last_donated || null),
    address: data.address || null,
    area: data.area || null,
    city: data.city || 'Dhaka',
    latitude: data.latitude,
    longitude: data.longitude,
    preferred_channel: data.preferred_channel,
    preferred_language: data.preferred_language,
    consent_given: true,
    self_declared_eligible: selfDeclaredEligible,
    health_notes: healthNotes,
    show_on_leaderboard: data.show_on_leaderboard,
  }
}
