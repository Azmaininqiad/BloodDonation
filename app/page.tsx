import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Droplets, Users, Heart, ChevronRight } from 'lucide-react'

async function getStats() {
  try {
    const supabase = await createClient()
    const [{ count: donorsAvailable }, { count: fulfilled }, { count: donations }] = await Promise.all([
      supabase
        .from('donors_with_status')
        .select('*', { count: 'exact', head: true })
        .eq('availability_status', 'available'),
      supabase
        .from('blood_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fulfilled'),
      supabase
        .from('donation_history')
        .select('*', { count: 'exact', head: true }),
    ])
    return { donorsAvailable: donorsAvailable ?? 0, fulfilled: fulfilled ?? 0, donations: donations ?? 0 }
  } catch {
    return { donorsAvailable: 0, fulfilled: 0, donations: 0 }
  }
}

async function getLeaderboardPreview() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.rpc('get_leaderboard', { p_limit: 5 })
    return data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [stats, leaders] = await Promise.all([getStats(), getLeaderboardPreview()])

  return (
    <>
      <Navbar />
      <main className="flex flex-col">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-600 to-red-800 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <div className="text-6xl mb-4">🩸</div>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Every drop counts.
              <br />Find donors <span className="text-red-200">in minutes.</span>
            </h1>
            <p className="text-red-100 text-lg mb-10 max-w-xl mx-auto">
              BloodConnect connects patients who urgently need blood with nearby, eligible donors across Bangladesh.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/request/new">
                <Button size="lg" className="bg-white text-red-700 hover:bg-red-50 font-bold px-8 h-14 text-base w-full sm:w-auto shadow-lg">
                  <Droplets className="w-5 h-5 mr-2" />
                  I need blood
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-white text-red-700 hover:bg-red-50 font-bold px-8 h-14 text-base w-full sm:w-auto">
                  <Heart className="w-5 h-5 mr-2" />
                  Become a donor
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-extrabold text-red-600">{stats.donorsAvailable.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Users className="w-4 h-4" /> Donors available
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-green-600">{stats.fulfilled.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Heart className="w-4 h-4" /> Requests fulfilled
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-purple-600">{stats.donations.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Droplets className="w-4 h-4" /> Total donations
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 py-14">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: '1', icon: '📋', title: 'Submit a request', desc: 'Fill a quick form — no account needed. Tell us blood type, hospital, and urgency.' },
                { step: '2', icon: '📲', title: 'Donors get notified', desc: 'We instantly notify up to 10 nearby, compatible donors with a one-tap response link.' },
                { step: '3', icon: '🏥', title: 'Donation happens', desc: 'Confirmed donors see the hospital address and patient contact. You track everything in real time.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="text-4xl mb-3">{icon}</div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm mb-2">{step}</div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard teaser */}
        {leaders.length > 0 && (
          <section className="bg-white py-14">
            <div className="max-w-lg mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">🏆 Top Donors</h2>
                <Link href="/leaderboard" className="text-sm text-red-600 flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-2">
                {leaders.map((l: { display_name: string; area: string | null; donation_count: number }, i: number) => (
                  <Card key={i}>
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-300 w-6 text-center">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <div>
                          <div className="font-medium">{l.display_name}</div>
                          {l.area && <div className="text-xs text-gray-500">{l.area}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{l.donation_count}</div>
                        <div className="text-xs text-gray-500">donations</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA banner */}
        <section className="bg-red-600 text-white py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to save a life?</h2>
            <p className="text-red-100 mb-6">Register as a donor today. It only takes 3 minutes.</p>
            <Link href="/donor/register">
              <Button size="lg" className="bg-white text-red-700 hover:bg-red-50 font-bold px-8">
                Register as a donor
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 text-sm py-8">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <span>🩸</span> BloodConnect
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/blood-banks" className="hover:text-white">Blood Banks</Link>
              <Link href="/leaderboard" className="hover:text-white">Leaderboard</Link>
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
            </div>
            <p className="text-xs text-center sm:text-right max-w-xs text-gray-500">
              This platform connects donors with patients. It is not a medical service.
              Always consult qualified medical personnel.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
