import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { t, notification_id } = await request.json()

  if (!t || !notification_id) return NextResponse.json({ ok: false }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('patient_mark_donated', {
    p_request_id: id,
    p_token: t,
    p_notification_id: notification_id,
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
