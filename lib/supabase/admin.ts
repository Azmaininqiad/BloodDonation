import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSupabaseUrl } from '@/lib/supabase/config'

/** Service-role client. Never expose to the browser. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY
  if (!key) throw new Error('Missing required environment variable: SUPABASE_SECRET_KEY')

  return createClient<Database>(
    getSupabaseUrl(),
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
