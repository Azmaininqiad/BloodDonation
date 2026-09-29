import { createHash } from 'crypto'
import { type NextRequest } from 'next/server'

/** Extract client IP from request headers */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/** One-way hash of IP for storing without logging the raw IP */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'default-salt'
  return createHash('sha256').update(ip + salt).digest('hex')
}
