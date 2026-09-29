import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { RespondClient } from './RespondClient'

interface Notification {
  notification: {
    status: string
    distance_km: number | null
    wave: number
    donated_at: string | null
  }
  donor: { name: string; blood_type: string }
  request: {
    status: string
    blood_type: string
    units_needed: number
    urgency: string
    hospital_name: string
    hospital_address: string | null
    latitude: number
    longitude: number
    needed_by: string | null
    created_at: string
  }
  contacts: {
    contact_1: string
    contact_2: string | null
    requester_name: string | null
    patient_gender: string
  } | null
}

export default async function RespondPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.rpc('get_notification_by_token', { p_token: token })

  if (!data) notFound()

  return (
    <>
      {/* No referrer meta on respond pages */}
      <div className="min-h-screen bg-gray-50">
        <RespondClient token={token} initial={data as Notification} />
      </div>
    </>
  )
}
