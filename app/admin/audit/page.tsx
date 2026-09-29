import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const pageSize = 50
  const from = (pageNum - 1) * pageSize

  const supabase = createAdminClient()
  const { data: logs, count } = await supabase
    .from('contact_access_log')
    .select('id, request_id, notification_id, viewer_type, kind, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const kindBadge: Record<string, string> = {
    view: 'bg-blue-100 text-blue-700',
    call: 'bg-green-100 text-green-700',
    whatsapp: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Audit Log – Contact Access ({count ?? 0})</h1>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Time', 'Viewer', 'Kind', 'Request ID', 'Notification ID'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(logs ?? []).map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{format(new Date(l.created_at), 'd MMM, h:mm a')}</td>
                  <td className="px-4 py-2 font-medium">{l.viewer_type}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${kindBadge[l.kind] ?? 'bg-gray-100'}`}>{l.kind}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400 truncate max-w-32">{l.request_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400 truncate max-w-32">{l.notification_id?.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(logs ?? []).length === 0 && <p className="text-center text-gray-400 py-8">No audit entries yet</p>}
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${p === pageNum ? 'bg-red-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
            >{p}</a>
          ))}
        </div>
      )}
    </div>
  )
}
