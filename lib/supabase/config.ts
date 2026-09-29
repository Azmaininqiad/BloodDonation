export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')

  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}

export function getSupabasePublishableKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!key) throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

  return key
}