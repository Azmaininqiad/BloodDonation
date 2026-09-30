import type { BloodType } from '@/types/database'

/**
 * Returns the donor blood types that can donate to a patient with the given blood type.
 * Mirrors the SQL function compatible_donor_types().
 */
export const COMPATIBLE_DONORS: Record<BloodType, BloodType[]> = {
  'O-':  ['O-'],
  'O+':  ['O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
}

export function compatibleDonorTypes(patientBloodType: BloodType): BloodType[] {
  return COMPATIBLE_DONORS[patientBloodType] ?? []
}

/** All 8 blood types in display order */
export const ALL_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
