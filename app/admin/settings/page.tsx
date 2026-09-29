import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminSettingsForm } from './AdminSettingsForm'

export default async function AdminSettingsPage() {
  const supabase = createAdminClient()
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value, description')
    .order('key')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">App Settings</h1>
      <p className="text-gray-500 text-sm">These values control matching, escalation, and cooldown behaviour.</p>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
        <CardContent>
          <AdminSettingsForm settings={settings ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
