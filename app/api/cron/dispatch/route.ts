import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { dispatchPendingNotifications } from '@/lib/dispatch'

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still run timingSafeEqual on equal-length buffers to avoid timing leak
    timingSafeEqual(Buffer.from(a), Buffer.from(a))
    return false
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? ''
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''

  if (!secret || !safeEqual(token, secret)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await dispatchPendingNotifications()
    return NextResponse.json({ ok: true, ...result })
  } catch (err: unknown) {
    console.error('[cron/dispatch]', err)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
