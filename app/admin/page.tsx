import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Heart, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BloodTypeBadge } from '@/components/BloodTypeBadge'
import type { BloodType } from '@/types/database'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()
  const { data: stats } = await supabase.rpc('admin_dashboard_stats')

  const s = stats as {
    donors_total: number
    donors_available_now: number
    requests_open: number
    requests_fulfilled: number
    requests_expired: number
    avg_minutes_to_first_confirmation: number | null
    open_requests_by_blood_type: Record<string, number>
  } | null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total donors" value={s?.donors_total ?? 0} bg="bg-blue-50" />
        <StatCard icon={<Heart className="w-5 h-5 text-green-600" />} label="Available now" value={s?.donors_available_now ?? 0} bg="bg-green-50" />
        <StatCard icon={<FileText className="w-5 h-5 text-amber-600" />} label="Open requests" value={s?.requests_open ?? 0} bg="bg-amber-50" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Fulfilled" value={s?.requests_fulfilled ?? 0} bg="bg-purple-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Open requests by blood type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open requests by blood type</CardTitle>
          </CardHeader>
          <CardContent>
            {!s?.open_requests_by_blood_type || Object.keys(s.open_requests_by_blood_type).length === 0 ? (
              <p className="text-gray-400 text-sm">No open requests</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Object.entries(s.open_requests_by_blood_type).map(([bt, cnt]) => (
                  <div key={bt} className="flex items-center gap-1.5">
                    <BloodTypeBadge type={bt as BloodType} size="sm" />
                    <span className="font-bold">{cnt}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Avg. time to first confirmation</span>
              <span className="font-bold">{s?.avg_minutes_to_first_confirmation != null ? `${s.avg_minutes_to_first_confirmation} min` : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expired requests</span>
              <span className="font-bold text-red-500">{s?.requests_expired ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fulfilment rate</span>
              <span className="font-bold">
                {s && (s.requests_fulfilled + s.requests_expired) > 0
                  ? `${Math.round((s.requests_fulfilled / (s.requests_fulfilled + s.requests_expired)) * 100)}%`
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/donors"><Button variant="outline">Manage donors</Button></Link>
        <Link href="/admin/requests"><Button variant="outline">Manage requests</Button></Link>
        <Link href="/admin/hospitals"><Button variant="outline">Manage hospitals</Button></Link>
        <Link href="/admin/settings"><Button variant="outline">App settings</Button></Link>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <Card>
      <CardContent className={`pt-4 ${bg} rounded-lg`}>
        <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
        <div className="text-2xl font-extrabold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}
