import type { UrgencyLevel, BloodType } from '@/types/database'

interface TemplateParams {
  donorName: string
  bloodType: BloodType
  units: number
  urgency: UrgencyLevel
  hospitalName: string
  distanceKm: number | null
  responseUrl: string
  language: 'en' | 'bn'
}

const urgencyWordEn: Record<UrgencyLevel, string> = {
  high: 'URGENT',
  mid: 'Needed',
  low: 'Planned',
}

export function buildSmsMessage(p: TemplateParams): string {
  const dist = p.distanceKm != null ? `~${Number(p.distanceKm).toFixed(1)} km` : 'nearby'

  if (p.language === 'bn') {
    return `BloodConnect: ${p.hospitalName}-এ ${p.bloodType} রক্ত প্রয়োজন (${p.units} ব্যাগ), আপনার থেকে ${dist}। সাহায্য করতে পারবেন? ${p.responseUrl}`
  }
  return `BloodConnect: ${urgencyWordEn[p.urgency]} – ${p.bloodType} blood needed (${p.units} bag${p.units > 1 ? 's' : ''}) at ${p.hospitalName}, ${dist} from you. Can you help? ${p.responseUrl}`
}

export function buildEmailSubject(p: TemplateParams): string {
  if (p.language === 'bn') return `BloodConnect: ${p.bloodType} রক্তের অনুরোধ`
  return `BloodConnect: ${urgencyWordEn[p.urgency]} – ${p.bloodType} blood needed`
}

export function buildEmailHtml(p: TemplateParams): string {
  const dist = p.distanceKm != null ? `${Number(p.distanceKm).toFixed(1)} km` : 'nearby'

  if (p.language === 'bn') {
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#dc2626">🩸 BloodConnect</h2>
  <p>প্রিয় ${p.donorName},</p>
  <p><strong>${p.hospitalName}</strong>-এ <strong>${p.bloodType}</strong> রক্তের জরুরি প্রয়োজন।</p>
  <ul>
    <li>পরিমাণ: ${p.units} ব্যাগ</li>
    <li>আপনার থেকে দূরত্ব: ${dist}</li>
  </ul>
  <a href="${p.responseUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">সাড়া দিন</a>
  <p style="color:#6b7280;font-size:12px">চূড়ান্ত যোগ্যতা রক্তদান কেন্দ্রের চিকিৎসা কর্মীরা নির্ধারণ করবেন।</p>
</div>`
  }

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#dc2626">🩸 BloodConnect</h2>
  <p>Dear ${p.donorName},</p>
  <p>There is an <strong>${urgencyWordEn[p.urgency]}</strong> need for <strong>${p.bloodType}</strong> blood at <strong>${p.hospitalName}</strong>.</p>
  <ul>
    <li>Amount: ${p.units} bag${p.units > 1 ? 's' : ''}</li>
    <li>Distance from you: ${dist}</li>
  </ul>
  <a href="${p.responseUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Respond to request</a>
  <p style="color:#6b7280;font-size:12px">Final eligibility is decided by medical staff at the donation site. Do not donate if you feel unwell.</p>
</div>`
}
