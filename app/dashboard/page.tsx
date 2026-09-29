import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { DashboardClient } from './DashboardClient'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: donor } = await supabase
    .from('donors_with_status')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!donor) {
    return (
      <>
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-16 text-center">
          <span className="text-5xl">🩸</span>
          <h1 className="text-xl font-bold mt-4 mb-2">Complete your donor profile</h1>
          <p className="text-gray-500 mb-6">You need to register as a donor to access your dashboard.</p>
          <Link href="/donor/register">
            <Button className="bg-red-600 hover:bg-red-700">Register as a donor</Button>
          </Link>
        </main>
      </>
    )
  }

  // Load notification history
  const { data: notifications } = await supabase
    .from('request_notifications')
    .select('id, response_token, status, notified_at, distance_km')
    .eq('donor_id', donor.id)
    .order('notified_at', { ascending: false })
    .limit(20)

  const { data: history } = await supabase
    .from('donation_history')
    .select('id, donated_on, units, request_id')
    .eq('donor_id', donor.id)
    .order('donated_on', { ascending: false })
    .limit(20)

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <DashboardClient
          donor={donor}
          notifications={notifications ?? []}
          history={history ?? []}
        />
      </main>
    </>
  )
}
