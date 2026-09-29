'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LanguageToggle } from './LanguageToggle'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User | null
  isAdmin: boolean
}

export function NavbarClient({ user, isAdmin }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      {user ? (
        <>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <Link href="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              Sign up
            </Button>
          </Link>
        </>
      )}
    </div>
  )
}
