import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavbarClient } from './NavbarClient'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-red-600 text-lg">
          <span className="text-2xl" aria-hidden>🩸</span>
          BloodConnect
        </Link>
        <NavbarClient user={user} isAdmin={isAdmin} />
      </nav>
    </header>
  )
}
