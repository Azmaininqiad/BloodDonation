export interface EmailSendResult {
  ok: boolean
  error?: string
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'BloodConnect <noreply@bloodconnect.app>'

  if (!apiKey) {
    // Log to console if no key configured
    console.log('[EMAIL STUB] To:', params.to)
    console.log('[EMAIL STUB] Subject:', params.subject)
    return { ok: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text }
    }
    return { ok: true }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
