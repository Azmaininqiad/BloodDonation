import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { BloodTypeBadge } from '@/components/BloodTypeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { Card, CardContent } from '@/components/ui/card'
import { AdminRequestActions } from './AdminRequestActions'
import type { BloodType, UrgencyLevel } from '@/types/database'

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page = '1', status = '' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const pageSize = 25
  const from = (pageNum - 1) * pageSize

  const supabase = createAdminClient()
  let query = supabase
    .from('blood_requests')
    .select('id, blood_type, units_needed, urgency, hospital_name, status, contact_1, current_wave, radius_km, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) query = query.eq('status', status)

  const { data: requests, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700', fulfilled: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-500', cancelled: 'bg-red-100 text-red-500',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Requests ({count ?? 0})</h1>
        <div className="flex gap-2 flex-wrap">
          {['', 'open', 'fulfilled', 'expired', 'cancelled'].map((s) => (
            <a
              key={s}
              href={`?status=${s}`}
              className={`text-sm px-3 py-1 rounded-full border ${status === s ? 'bg-gray-800 text-white border-gray-800' : 'hover:bg-gray-100'}`}
            >
              {s || 'All'}
            </a>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Blood', 'Units', 'Urgency', 'Hospital', 'Wave', 'Status', 'Submitted', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(requests ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2"><BloodTypeBadge type={r.blood_type as BloodType} size="sm" /></td>
                  <td className="px-4 py-2 font-medium">{r.units_needed}</td>
                  <td className="px-4 py-2"><UrgencyBadge urgency={r.urgency as UrgencyLevel} /></td>
                  <td className="px-4 py-2 text-gray-600 max-w-32 truncate">{r.hospital_name}</td>
                  <td className="px-4 py-2 text-gray-500">{r.current_wave} / {r.radius_km}km</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] ?? 'bg-gray-100'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{format(new Date(r.created_at), 'd MMM, h:mm a')}</td>
                  <td className="px-4 py-2">
                    {r.status === 'open' && <AdminRequestActions requestId={r.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(requests ?? []).length === 0 && <p className="text-center text-gray-400 py-8">No requests found</p>}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?page=${p}${status ? `&status=${status}` : ''}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${p === pageNum ? 'bg-red-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
            >{p}</a>
          ))}
        </div>
      )}
    </div>
  )
}
