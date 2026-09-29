import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RequestStatus } from '@/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { t, status } = await request.json()

  if (!t || !['fulfilled', 'cancelled'].includes(status)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('close_request', {
    p_request_id: id,
    p_token: t,
    p_new_status: status as RequestStatus,
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
