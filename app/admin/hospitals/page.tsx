import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { AdminHospitalForm } from './AdminHospitalForm'
import { AdminHospitalActions } from './AdminHospitalActions'

export default async function AdminHospitalsPage() {
  const supabase = createAdminClient()
  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('id, name, address, area, city, phone, latitude, longitude, is_active')
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Hospitals</h1>

      <Card>
        <CardContent className="pt-4">
          <h2 className="font-semibold mb-3">Add new hospital</h2>
          <AdminHospitalForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Area', 'City', 'Phone', 'Coords', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(hospitals ?? []).map((h) => (
                <tr key={h.id} className={`hover:bg-gray-50 ${!h.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 font-medium max-w-48 truncate">{h.name}</td>
                  <td className="px-4 py-2 text-gray-500">{h.area}</td>
                  <td className="px-4 py-2 text-gray-500">{h.city}</td>
                  <td className="px-4 py-2 text-gray-500">{h.phone ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{Number(h.latitude).toFixed(4)}, {Number(h.longitude).toFixed(4)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {h.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <AdminHospitalActions hospitalId={h.id} isActive={h.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
