import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, FileText, Building2, Droplets, Settings, ClipboardList } from 'lucide-react'

const NAV = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/donors',       icon: Users,           label: 'Donors' },
  { href: '/admin/requests',     icon: FileText,        label: 'Requests' },
  { href: '/admin/hospitals',    icon: Building2,       label: 'Hospitals' },
  { href: '/admin/blood-banks',  icon: Droplets,        label: 'Blood Banks' },
  { href: '/admin/settings',     icon: Settings,        label: 'Settings' },
  { href: '/admin/audit',        icon: ClipboardList,   label: 'Audit Log' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-red-400">
          <span>🩸</span> BloodConnect Admin
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">← Back to site</Link>
      </header>
      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-52 bg-gray-800 text-gray-300 py-4 hidden sm:block shrink-0">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        {/* Mobile tab nav */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900 flex border-t border-gray-700 z-40">
          {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 text-gray-400 hover:text-white text-xs gap-1">
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-6 bg-gray-50 overflow-auto pb-20 sm:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
