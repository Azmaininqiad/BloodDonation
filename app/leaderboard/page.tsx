import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'

export const revalidate = 300 // 5-minute ISR

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: leaders } = await supabase.rpc('get_leaderboard', { p_limit: 20 })

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="text-2xl font-bold">Top Donors</h1>
          <p className="text-gray-500 text-sm mt-1">Opt-in donors who have made the most impact</p>
        </div>

        {!leaders || leaders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              No donors on the leaderboard yet. Be the first!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {leaders.map((l: { display_name: string; area: string | null; donation_count: number; last_donated: string | null }, i: number) => (
              <Card key={i} className={i < 3 ? 'border-red-200' : ''}>
                <CardContent className="py-3 flex items-center gap-4">
                  <span className="text-2xl w-10 text-center shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400 font-bold text-base">#{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{l.display_name}</div>
                    {l.area && <div className="text-xs text-gray-500 truncate">{l.area}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-red-600 text-lg">{l.donation_count}</div>
                    <div className="text-xs text-gray-500">donations</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
