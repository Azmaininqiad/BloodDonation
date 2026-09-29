'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BloodTypeBadge } from '@/components/BloodTypeBadge'
import type { Database } from '@/types/database'

type DonorWithStatus = Database['public']['Views']['donors_with_status']['Row']
type Notification = { id: string; response_token: string; status: string; notified_at: string; distance_km: number | null }
type HistoryRow = { id: string; donated_on: string; units: number; request_id: string | null }

interface Props {
  donor: DonorWithStatus
  notifications: Notification[]
  history: HistoryRow[]
}

const statusBadge: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  cooldown:  'bg-amber-100 text-amber-800',
  paused:    'bg-gray-100 text-gray-700',
  inactive:  'bg-red-100 text-red-700',
}

const notifStatusBadge: Record<string, string> = {
  notified:   'bg-blue-100 text-blue-700',
  confirmed:  'bg-green-100 text-green-800',
  donated:    'bg-purple-100 text-purple-800',
  declined:   'bg-gray-100 text-gray-500',
  no_response:'bg-amber-100 text-amber-700',
  cancelled:  'bg-gray-100 text-gray-500',
}

export function DashboardClient({ donor: initial, notifications, history }: Props) {
  const [donor, setDonor] = useState(initial)
  const [toggling, setToggling] = useState(false)
  const supabase = createClient()

  // Realtime: listen for new request_notifications for this donor
  useEffect(() => {
    const channel = supabase
      .channel('donor-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_notifications',
          filter: `donor_id=eq.${donor.id}`,
        },
        () => {
          toast.info('🩸 New blood request near you!', {
            description: 'Check your dashboard for details.',
            duration: 8000,
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [donor.id, supabase])

  async function toggleAvailability() {
    setToggling(true)
    const newVal = !donor.is_available
    const { error } = await supabase
      .from('donors')
      .update({ is_available: newVal })
      .eq('id', donor.id)
    if (error) {
      toast.error('Failed to update availability')
    } else {
      setDonor((d) => ({ ...d, is_available: newVal }))
      toast.success(newVal ? 'You are now available for requests' : 'You are now paused')
    }
    setToggling(false)
  }

  const status = donor.availability_status as string
  const nextEligible = donor.available_from
    ? format(new Date(donor.available_from), 'd MMM yyyy')
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {donor.full_name.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm">{donor.area ? `${donor.area}, ` : ''}{donor.city}</p>
        </div>
        <Link href="/dashboard/profile">
          <Button variant="outline" size="sm">Edit profile</Button>
        </Link>
      </div>

      {/* Status card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Availability status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <BloodTypeBadge type={donor.blood_type} size="lg" />
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusBadge[status] ?? 'bg-gray-100'}`}>
              {status === 'available' ? 'Available' :
               status === 'cooldown'  ? `Cooldown – available ${nextEligible}` :
               status === 'paused'    ? 'Paused' : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Available for requests</span>
              <span className="ml-2 text-xs text-gray-400">(toggle to pause)</span>
            </div>
            <button
              onClick={toggleAvailability}
              disabled={toggling || status === 'inactive'}
              aria-label="Toggle availability"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                donor.is_available ? 'bg-red-600' : 'bg-gray-200'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  donor.is_available ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{donor.donation_count}</div>
              <div className="text-xs text-gray-500">Total donations</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800">
                {donor.last_donated ? format(new Date(donor.last_donated), 'd MMM yy') : '—'}
              </div>
              <div className="text-xs text-gray-500">Last donated</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800">{nextEligible ?? '—'}</div>
              <div className="text-xs text-gray-500">Next eligible</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incoming requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Requests for you</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No requests yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <div key={n.id} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-gray-500">{format(new Date(n.notified_at), 'd MMM yyyy, h:mm a')}</div>
                    {n.distance_km && (
                      <div className="text-xs text-gray-500">{Number(n.distance_km).toFixed(1)} km away</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${notifStatusBadge[n.status] ?? 'bg-gray-100'}`}>
                      {n.status}
                    </span>
                    <Link href={`/respond/${n.response_token}`}>
                      <Button size="sm" variant="outline" className="text-xs h-7">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Donation history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No donation history yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((h) => (
                <div key={h.id} className="py-3 flex justify-between text-sm">
                  <span>{format(new Date(h.donated_on), 'd MMM yyyy')}</span>
                  <Badge variant="secondary">{h.units} bag{h.units !== 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
