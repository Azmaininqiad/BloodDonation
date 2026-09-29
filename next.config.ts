import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection',        value: '1; mode=block' },
  { key: 'Permissions-Policy',      value: 'geolocation=(self), camera=(), microphone=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // needed for Next.js HMR + Leaflet
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.tile.openstreetmap.org https://unpkg.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // Empty turbopack config silences the "webpack config present" warning in Next 16
  turbopack: {},

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // No-index for private token routes
      {
        source: '/request/:id',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/respond/:token',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
