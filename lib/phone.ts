import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js'

const DEFAULT_COUNTRY: CountryCode = 'BD'

/**
 * Normalise a phone number to E.164 format.
 * Default country is Bangladesh (BD), so "01712345678" becomes "+8801712345678".
 * Throws if the number is invalid.
 */
export function normalizePhone(raw: string): string {
  // Strip common formatting chars
  const cleaned = raw.trim().replace(/[\s\-().]/g, '')

  // Already looks like E.164
  const candidate = cleaned.startsWith('+') ? cleaned : cleaned

  if (!isValidPhoneNumber(candidate, DEFAULT_COUNTRY)) {
    throw new Error(`Invalid phone number: ${raw}`)
  }

  const parsed = parsePhoneNumber(candidate, DEFAULT_COUNTRY)
  return parsed.format('E.164')
}

/**
 * Same as normalizePhone but returns null instead of throwing.
 */
export function tryNormalizePhone(raw: string): string | null {
  try {
    return normalizePhone(raw)
  } catch {
    return null
  }
}

/** Validate phone string for Zod schemas */
export function isValidPhone(raw: string): boolean {
  return tryNormalizePhone(raw) !== null
}
