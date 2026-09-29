import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { t, notification_id, kind } = await request.json()

  if (!t || !notification_id || !['view', 'call', 'whatsapp'].includes(kind)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify token is valid
  const { data: status } = await supabase.rpc('get_request_status', {
    p_request_id: id,
    p_token: t,
  })
  if (!status) return NextResponse.json({ ok: false }, { status: 404 })

  await supabase.rpc('log_contact_access', {
    p_request_id: id,
    p_notification_id: notification_id,
    p_viewer: 'requester',
    p_kind: kind,
  })

  return NextResponse.json({ ok: true })
}
