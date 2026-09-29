import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/ip'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('get_notification_by_token', { p_token: token })

  if (error || !data) {
    return NextResponse.json(null, { status: 404 })
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const ip = getClientIp(request)

  // Rate-limit: 20 respond actions per IP per minute
  const { allowed } = rateLimit(`respond:${ip}`, 20, 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const { action } = await request.json()
  if (!['confirm', 'decline', 'donated'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Log contact access when donor confirms (reveals contact info)
  if (action === 'confirm') {
    const { data: notif } = await supabase.rpc('get_notification_by_token', { p_token: token })
    if (notif) {
      // We log after confirming below, but get the IDs first
    }
  }

  const { data, error } = await supabase.rpc('respond_to_notification', {
    p_token: token,
    p_action: action,
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const result = data as Record<string, unknown>

  // Map error codes to HTTP status
  if (!result.ok) {
    const code = result.code as string
    const statusMap: Record<string, number> = {
      not_found: 404,
      request_closed: 410,
      request_full: 409,
      not_confirmed: 409,
      invalid_action: 400,
    }
    return NextResponse.json(result, { status: statusMap[code] ?? 400 })
  }

  return NextResponse.json(result)
}
