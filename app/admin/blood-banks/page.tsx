import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { AdminBloodBankForm } from './AdminBloodBankForm'
import { AdminBloodBankActions } from './AdminBloodBankActions'

export default async function AdminBloodBanksPage() {
  const supabase = createAdminClient()
  const { data: banks } = await supabase
    .from('blood_banks')
    .select('id, name, phone, address, area, city, open_hours, latitude, longitude, is_active')
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Blood Banks</h1>
      <Card>
        <CardContent className="pt-4">
          <h2 className="font-semibold mb-3">Add new blood bank</h2>
          <AdminBloodBankForm />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Area', 'Phone', 'Hours', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(banks ?? []).map((b) => (
                <tr key={b.id} className={`hover:bg-gray-50 ${!b.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 font-medium max-w-40 truncate">{b.name}</td>
                  <td className="px-4 py-2 text-gray-500">{b.area ?? b.city}</td>
                  <td className="px-4 py-2 text-gray-500">{b.phone ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-500 max-w-32 truncate">{b.open_hours ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-2"><AdminBloodBankActions bankId={b.id} isActive={b.is_active} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(banks ?? []).length === 0 && <p className="text-center text-gray-400 py-8">No blood banks yet</p>}
        </CardContent>
      </Card>
    </div>
  )
}
