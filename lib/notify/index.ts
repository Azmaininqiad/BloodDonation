import { sendEmail } from './email/resend'
import { buildEmailHtml, buildEmailSubject, buildSmsMessage } from './templates'
import type { BloodType, UrgencyLevel } from '@/types/database'
import { getAppUrl } from '@/lib/app-url'

export interface NotificationRow {
  notification_id: string
  response_token: string
  donor_name: string
  donor_phone: string
  donor_email: string | null
  preferred_channel: string
  preferred_language: string
  blood_type: BloodType
  units_needed: number
  urgency: UrgencyLevel
  hospital_name: string
  distance_km: number | null
}

export interface SendResult {
  ok: boolean
  channel: string
  error?: string
}

/** Send a notification to a donor. Email-only implementation. */
export async function sendNotification(row: NotificationRow): Promise<SendResult> {
  const appUrl = getAppUrl()
  const responseUrl = `${appUrl}/respond/${row.response_token}`
  const lang = (row.preferred_language === 'bn' ? 'bn' : 'en') as 'en' | 'bn'

  const templateParams = {
    donorName: row.donor_name,
    bloodType: row.blood_type,
    units: row.units_needed,
    urgency: row.urgency,
    hospitalName: row.hospital_name,
    distanceKm: row.distance_km,
    responseUrl,
    language: lang,
  }

  // For now, email is the only channel implemented.
  // SMS / WhatsApp stubs can be added later.
  if (!row.donor_email) {
    // No email — log to console as fallback (dev mode / no provider)
    const msg = buildSmsMessage(templateParams)
    console.log(`[NOTIFY] No email for donor ${row.donor_name} (${row.donor_phone}). Would send: ${msg}`)
    return { ok: true, channel: 'console' }
  }

  const subject = buildEmailSubject(templateParams)
  const html = buildEmailHtml(templateParams)

  const result = await sendEmail({ to: row.donor_email, subject, html })
  return { ok: result.ok, channel: 'email', error: result.error }
}
