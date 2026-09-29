import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { BloodTypeBadge } from '@/components/BloodTypeBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminDonorActions } from './AdminDonorActions'
import type { BloodType } from '@/types/database'

export default async function AdminDonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { page = '1', q = '' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const pageSize = 25
  const from = (pageNum - 1) * pageSize

  const supabase = createAdminClient()
  let query = supabase
    .from('donors')
    .select('id, full_name, blood_type, phone, is_available, is_active, donation_count, city, area, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: donors, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Donors ({count ?? 0})</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search by name…" className="border rounded px-3 py-1.5 text-sm" />
          <button type="submit" className="bg-gray-800 text-white px-3 py-1.5 text-sm rounded">Search</button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Blood', 'Phone', 'City', 'Donations', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(donors ?? []).map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{d.full_name}</td>
                  <td className="px-4 py-2"><BloodTypeBadge type={d.blood_type as BloodType} size="sm" /></td>
                  <td className="px-4 py-2 text-gray-500">{d.phone}</td>
                  <td className="px-4 py-2 text-gray-500">{d.area ? `${d.area}, ` : ''}{d.city}</td>
                  <td className="px-4 py-2 font-bold text-red-600">{d.donation_count}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.is_active ? (d.is_available ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')
                                  : 'bg-red-100 text-red-700'
                    }`}>
                      {!d.is_active ? 'Banned' : d.is_available ? 'Available' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400">{format(new Date(d.created_at), 'd MMM yy')}</td>
                  <td className="px-4 py-2">
                    <AdminDonorActions donorId={d.id} isActive={d.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(donors ?? []).length === 0 && (
            <p className="text-center text-gray-400 py-8">No donors found</p>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}${q ? `&q=${q}` : ''}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                p === pageNum ? 'bg-red-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
