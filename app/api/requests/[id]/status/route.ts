import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = request.nextUrl.searchParams.get('t')

  if (!token) return NextResponse.json(null, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('get_request_status', {
    p_request_id: id,
    p_token: token,
  })

  if (error || !data) return NextResponse.json(null, { status: 404 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
