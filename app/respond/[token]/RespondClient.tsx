'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { BloodTypeBadge } from '@/components/BloodTypeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Phone, AlertTriangle, CheckCircle, Heart } from 'lucide-react'
import type { UrgencyLevel, BloodType } from '@/types/database'

interface Notification {
  notification: { status: string; distance_km: number | null; wave: number; donated_at: string | null }
  donor: { name: string; blood_type: string }
  request: {
    status: string; blood_type: string; units_needed: number; urgency: string
    hospital_name: string; hospital_address: string | null
    latitude: number; longitude: number; needed_by: string | null; created_at: string
  }
  contacts: { contact_1: string; contact_2: string | null; requester_name: string | null; patient_gender: string } | null
}

interface Props {
  token: string
  initial: Notification
}

export function RespondClient({ token, initial }: Props) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  const { notification: n, donor, request: r, contacts } = data
  const status = n.status

  async function act(action: 'confirm' | 'decline' | 'donated') {
    setLoading(action)
    try {
      const res = await fetch(`/api/respond/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()
      if (!result.ok) {
        const messages: Record<string, string> = {
          request_closed: 'This request has already been closed.',
          request_full: 'Enough donors have already confirmed. Thank you!',
          not_confirmed: 'Please confirm first before marking as donated.',
          not_found: 'This request was not found.',
        }
        toast.error(messages[result.code as string] ?? 'Something went wrong')
      } else {
        // Refresh data
        const fresh = await fetch(`/api/respond/${token}`)
        if (fresh.ok) setData(await fresh.json())
        toast.success(
          action === 'confirm' ? 'Confirmed! Thank you for stepping up.' :
          action === 'decline' ? 'Response recorded.' :
          'Thank you for donating! You are a hero.'
        )
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      {/* Header */}
      <div className="text-center mb-2">
        <span className="text-4xl">🩸</span>
        <h1 className="text-xl font-bold text-red-600 mt-1">BloodConnect</h1>
        <p className="text-gray-500 text-sm">Blood donation request</p>
      </div>

      {/* Request summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BloodTypeBadge type={r.blood_type as BloodType} />
            <UrgencyBadge urgency={r.urgency as UrgencyLevel} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">{r.hospital_name}</div>
              {r.hospital_address && <div className="text-gray-500">{r.hospital_address}</div>}
            </div>
          </div>
          <div className="flex gap-4 text-gray-600">
            <span><strong>{r.units_needed}</strong> bag{r.units_needed > 1 ? 's' : ''} needed</span>
            {n.distance_km && <span>~{Number(n.distance_km).toFixed(1)} km from you</span>}
          </div>
          {r.needed_by && (
            <div className="text-gray-600">
              Needed by: <strong>{format(new Date(r.needed_by), 'd MMM yyyy, h:mm a')}</strong>
            </div>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-red-600 hover:underline text-xs mt-1"
          >
            <MapPin className="w-3 h-3" /> Get directions
          </a>
        </CardContent>
      </Card>

      {/* Donor's status-based UI */}
      {(status === 'notified' || status === 'no_response') && r.status === 'open' && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-gray-700">
              Hi <strong>{donor.name}</strong>, can you donate <strong>{r.blood_type}</strong> blood at {r.hospital_name}?
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => act('confirm')}
                disabled={!!loading}
              >
                {loading === 'confirm' ? 'Confirming…' : '✅ I can donate'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => act('decline')}
                disabled={!!loading}
              >
                {loading === 'decline' ? '…' : '❌ Not available'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'confirmed' && contacts && r.status === 'open' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2 text-green-800 font-medium">
              <CheckCircle className="w-5 h-5" />
              Thank you for confirming!
            </div>
            <p className="text-sm text-green-700">
              Please contact the patient&apos;s family to coordinate your visit.
            </p>
            <div className="space-y-2">
              {contacts.requester_name && (
                <p className="text-sm font-medium">{contacts.requester_name}</p>
              )}
              <a
                href={`tel:${contacts.contact_1}`}
                className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
              >
                <Phone className="w-4 h-4" /> {contacts.contact_1}
              </a>
              {contacts.contact_2 && (
                <a
                  href={`tel:${contacts.contact_2}`}
                  className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
                >
                  <Phone className="w-4 h-4" /> {contacts.contact_2}
                </a>
              )}
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => act('donated')}
              disabled={!!loading}
            >
              {loading === 'donated' ? 'Recording…' : '🩸 I have donated'}
            </Button>
          </CardContent>
        </Card>
      )}

      {status === 'donated' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4 text-center space-y-2">
            <Heart className="w-10 h-10 text-red-600 mx-auto" />
            <h2 className="font-bold text-lg text-purple-800">Thank you for donating!</h2>
            <p className="text-sm text-purple-700">
              You saved a life today. You can donate again after 120 days.
            </p>
            {n.donated_at && (
              <p className="text-xs text-purple-500">
                Donated on {format(new Date(n.donated_at), 'd MMM yyyy')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {status === 'declined' && (
        <Card>
          <CardContent className="pt-4 text-center space-y-3">
            <p className="text-sm text-gray-600">Thanks for responding. No problem at all!</p>
            <Button variant="outline" className="w-full" onClick={() => act('confirm')} disabled={!!loading}>
              {loading === 'confirm' ? '…' : 'I changed my mind – I can donate'}
            </Button>
          </CardContent>
        </Card>
      )}

      {(r.status !== 'open' || status === 'cancelled') && status !== 'donated' && (
        <Card className="border-gray-200">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-gray-500">This request has been closed. Thank you.</p>
          </CardContent>
        </Card>
      )}

      {/* Medical disclaimer */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Final eligibility is decided by medical staff at the donation site.
          Do not donate if you feel unwell.
        </p>
      </div>
    </div>
  )
}
