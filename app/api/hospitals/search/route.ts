import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 1) return NextResponse.json([])

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_hospitals', { p_query: q, p_limit: 8 })

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}
