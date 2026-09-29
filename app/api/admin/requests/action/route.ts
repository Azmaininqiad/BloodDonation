import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // Verify the caller is an admin
  const userSupabase = await createClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const { requestId, action } = await request.json()
  if (!requestId || !['expire', 'cancel'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const newStatus = action === 'expire' ? 'expired' : 'cancelled'
  const { error } = await supabase
    .from('blood_requests')
    .update({ status: newStatus })
    .eq('id', requestId)
    .eq('status', 'open')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
