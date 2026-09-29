import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const userSupabase = await createClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const { key, value } = await request.json()
  if (!key) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })

  // Convert string value to appropriate JSON (number or string)
  const numVal = Number(value)
  const jsonVal = !isNaN(numVal) && value !== '' ? numVal : value

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('app_settings')
    .update({ value: jsonVal })
    .eq('key', key)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
