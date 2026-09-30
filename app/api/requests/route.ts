import { NextRequest, NextResponse } from 'next/server'
import { requestSchema, toRequestInsert } from '@/lib/validation/request'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIp, hashIp } from '@/lib/ip'
import { rateLimit } from '@/lib/ratelimit'
import { dispatchPendingNotifications } from '@/lib/dispatch'
import { getAppUrl } from '@/lib/app-url'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Honeypot check
    if (body.honeypot) {
      return NextResponse.json({ ok: false, error: 'bot_detected' }, { status: 422 })
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const ip = getClientIp(request)

    // IP-based rate limit: 5 requests per hour
    const { allowed } = rateLimit(`request:${ip}`, 5, 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited', message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const ipHash = hashIp(ip)
    const insert = toRequestInsert(parsed.data, ipHash)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('blood_requests')
      .insert(insert)
      .select('id, public_token')
      .single()

    if (error) {
      // DB rate limit (P0001 = too many requests from same phone)
      if (error.code === 'P0001') {
        return NextResponse.json(
          { ok: false, error: 'rate_limited', message: error.message },
          { status: 429 }
        )
      }
      throw error
    }

    const appUrl = getAppUrl()
    const statusUrl = `${appUrl}/request/${data.id}?t=${data.public_token}`

    // Fire-and-forget dispatch (wave 1 already inserted by DB trigger)
    dispatchPendingNotifications().catch(console.error)

    return NextResponse.json({ ok: true, id: data.id, token: data.public_token, status_url: statusUrl })
  } catch (err: unknown) {
    console.error('[POST /api/requests]', err)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
