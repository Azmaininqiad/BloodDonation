'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { BloodTypeBadge } from '@/components/BloodTypeBadge'
import { UrgencyBadge } from '@/components/UrgencyBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Phone, MapPin, Share2, CheckCircle } from 'lucide-react'
import type { BloodType, UrgencyLevel } from '@/types/database'

interface Donor {
  notification_id: string
  name: string
  phone: string
  blood_type: string
  distance_km: number
  status: string
  responded_at: string | null
}

interface StatusData {
  request: {
    id: string; status: string; blood_type: string; units_needed: number
    urgency: string; hospital_name: string; created_at: string
    expires_at: string | null; current_wave: number; radius_km: number
    escalation_exhausted: boolean
  }
  stats: { notified: number; confirmed: number; donated: number }
  donors: Donor[]
}

interface Props {
  requestId: string
  token: string
}

export function RequestStatusClient({ requestId, token }: Props) {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!token) { setNotFound(true); setLoading(false); return }
    try {
      const res = await fetch(`/api/requests/${requestId}/status?t=${token}`, { cache: 'no-store' })
      if (res.status === 404) { setNotFound(true); return }
      const json = await res.json()
      setData(json)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [requestId, token])

  useEffect(() => {
    fetchStatus()
    // Poll every 5s when open, 30s when closed
    const interval = setInterval(() => {
      if (!data || data.request.status === 'open') fetchStatus()
    }, data?.request.status === 'open' ? 5000 : 30000)
    return () => clearInterval(interval)
  }, [fetchStatus, data?.request.status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function markDonated(notifId: string) {
    setActionLoading(notifId)
    const res = await fetch(`/api/requests/${requestId}/mark-donated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: token, notification_id: notifId }),
    })
    const result = await res.json()
    if (result.ok) { toast.success('Marked as donated'); fetchStatus() }
    else toast.error('Could not mark as donated')
    setActionLoading(null)
  }

  async function closeRequest(status: 'fulfilled' | 'cancelled') {
    if (!confirm(`${status === 'fulfilled' ? 'Mark as fulfilled' : 'Cancel this request'}?`)) return
    setActionLoading(status)
    const res = await fetch(`/api/requests/${requestId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: token, status }),
    })
    const result = await res.json()
    if (result.ok) { toast.success(`Request ${status}`); fetchStatus() }
    else toast.error('Failed to close request')
    setActionLoading(null)
  }

  async function logContact(notifId: string, kind: 'call' | 'whatsapp') {
    await fetch(`/api/requests/${requestId}/log-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: token, notification_id: notifId, kind }),
    }).catch(() => {})
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    if (!data) return
    const r = data.request
    const text = `Urgent: ${r.blood_type} blood needed (${r.units_needed} bag${r.units_needed > 1 ? 's' : ''}) at ${r.hospital_name}. Please share!`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  if (notFound) return (
    <Card className="text-center py-12">
      <CardContent>
        <p className="text-gray-500">Request not found or link is invalid.</p>
      </CardContent>
    </Card>
  )

  if (!data) return null
  const { request: r, stats, donors } = data
  const isOpen = r.status === 'open'

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    fulfilled: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              <BloodTypeBadge type={r.blood_type as BloodType} size="lg" />
              <UrgencyBadge urgency={r.urgency as UrgencyLevel} />
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[r.status] ?? 'bg-gray-100'}`}>
              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>{r.hospital_name}</span>
          </div>
          <div className="flex gap-4 text-gray-600">
            <span><strong>{r.units_needed}</strong> bags needed</span>
            <span>Submitted {format(new Date(r.created_at), 'd MMM, h:mm a')}</span>
          </div>
          {r.expires_at && isOpen && (
            <p className="text-xs text-gray-400">Expires {format(new Date(r.expires_at), 'd MMM yyyy, h:mm a')}</p>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.notified}</div>
              <div className="text-xs text-gray-500">Notified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-xs text-gray-500">Confirmed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.donated}</div>
              <div className="text-xs text-gray-500">Donated</div>
            </div>
          </div>
          {isOpen && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Searching within {r.radius_km} km · Wave {r.current_wave}
            </p>
          )}
          <div className="mt-3 bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.confirmed / r.units_needed) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-500 mt-1">
            {stats.confirmed} / {r.units_needed} confirmed
          </p>
        </CardContent>
      </Card>

      {/* Confirmed donors */}
      {donors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Confirmed donors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {donors.map((d) => (
              <div key={d.notification_id} className="flex items-center justify-between gap-2 flex-wrap border-b border-gray-100 pb-3 last:border-0">
                <div>
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-gray-500">
                    <BloodTypeBadge type={d.blood_type as BloodType} size="sm" />
                    {' '}{d.distance_km != null ? `${Number(d.distance_km).toFixed(1)} km away` : ''}
                    {' '}· {d.status}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <a
                    href={`tel:${d.phone}`}
                    onClick={() => logContact(d.notification_id, 'call')}
                    className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1.5 rounded hover:bg-green-700"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${d.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => logContact(d.notification_id, 'whatsapp')}
                    className="inline-flex items-center gap-1 bg-[#25D366] text-white text-xs px-2 py-1.5 rounded hover:opacity-90"
                  >
                    WhatsApp
                  </a>
                  {d.status === 'confirmed' && isOpen && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => markDonated(d.notification_id)}
                      disabled={actionLoading === d.notification_id}
                    >
                      {actionLoading === d.notification_id ? '…' : 'Mark donated'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Share / escalation exhausted */}
      {(r.escalation_exhausted || (!isOpen && donors.length === 0)) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm text-amber-800 font-medium">
              Search exhausted – share this request to reach more people
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={shareWhatsApp}>
                Share on WhatsApp
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const text = `${r.blood_type} blood needed (${r.units_needed} bag${r.units_needed > 1 ? 's' : ''}) at ${r.hospital_name}`
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`, '_blank')
                }}
              >
                Share on Facebook
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {isOpen && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 flex items-center gap-2"
            onClick={copyLink}
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy status link'}
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
            onClick={() => closeRequest('fulfilled')}
            disabled={!!actionLoading}
          >
            ✅ Mark as fulfilled
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => closeRequest('cancelled')}
            disabled={!!actionLoading}
          >
            Cancel request
          </Button>
        </div>
      )}
    </div>
  )
}
