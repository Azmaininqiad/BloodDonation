import { z } from 'zod'
import { isValidPhone, normalizePhone } from '@/lib/phone'
import { ALL_BLOOD_TYPES } from '@/lib/compat'

const bloodTypeEnum = z.enum(ALL_BLOOD_TYPES as [string, ...string[]])

export const requestSchema = z.object({
  patient_name: z.string().max(100).optional().or(z.literal('')),
  patient_gender: z.enum(['male', 'female', 'other']),
  blood_type: bloodTypeEnum,
  units_needed: z.number().int().min(1, 'At least 1 bag').max(10, 'Maximum 10 bags'),
  urgency: z.enum(['high', 'mid', 'low']).default('mid'),
  hospital_id: z.string().uuid().optional().or(z.literal('')),
  hospital_name: z.string().min(1, 'Hospital name is required').max(200),
  hospital_address: z.string().max(300).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contact_1: z
    .string()
    .min(1, 'Primary contact number is required')
    .refine(isValidPhone, 'Invalid phone number'),
  contact_2: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || isValidPhone(v), 'Invalid phone number'),
  requester_name: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional().or(z.literal('')),
  needed_by: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  honeypot: z.string().max(0, 'Bot detected').optional(), // must be empty
})

export type RequestInput = z.infer<typeof requestSchema>

export function toRequestInsert(data: RequestInput, ipHash: string) {
  return {
    patient_name: data.patient_name || null,
    patient_gender: data.patient_gender,
    blood_type: data.blood_type,
    units_needed: data.units_needed,
    urgency: data.urgency,
    hospital_id: data.hospital_id || null,
    hospital_name: data.hospital_name,
    hospital_address: data.hospital_address || null,
    latitude: data.latitude,
    longitude: data.longitude,
    contact_1: normalizePhone(data.contact_1),
    contact_2: data.contact_2 ? normalizePhone(data.contact_2) : null,
    requester_name: data.requester_name || null,
    notes: data.notes || null,
    needed_by: data.needed_by || null,
    ip_hash: ipHash,
  }
}
