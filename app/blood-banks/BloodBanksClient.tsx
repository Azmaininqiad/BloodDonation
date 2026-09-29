'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Phone, MapPin, Clock, Loader2 } from 'lucide-react'

interface BloodBank {
  id: string
  name: string
  phone: string | null
  address: string | null
  area: string | null
  open_hours: string | null
  distance_km: number
}

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '23.8103')
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '90.4125')

export function BloodBanksClient() {
  const [banks, setBanks] = useState<BloodBank[]>([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)
  const [usingDefault, setUsingDefault] = useState(true)

  const supabase = createClient()

  async function fetchBanks(p_lat: number, p_lng: number) {
    setLoading(true)
    const { data } = await supabase.rpc('nearest_blood_banks', { p_lat, p_lng, p_limit: 10 })
    setBanks((data as BloodBank[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    // Try to get location on mount
    if (navigator.geolocation) {
      setLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
          setUsingDefault(false)
          setLocating(false)
          fetchBanks(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          setLocating(false)
          fetchBanks(DEFAULT_LAT, DEFAULT_LNG)
        },
        { timeout: 8000 }
      )
    } else {
      fetchBanks(DEFAULT_LAT, DEFAULT_LNG)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLat(latitude); setLng(longitude)
        setUsingDefault(false); setLocating(false)
        fetchBanks(latitude, longitude)
      },
      () => setLocating(false)
    )
  }

  return (
    <div className="space-y-4">
      {usingDefault && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <span>Showing results near Dhaka centre.</span>
          <Button size="sm" variant="outline" onClick={useMyLocation} disabled={locating} className="ml-2 shrink-0">
            {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Use my location'}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : banks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No blood banks found near your location.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banks.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold">{b.name}</div>
                  <span className="text-sm font-medium text-red-600 shrink-0">{b.distance_km} km</span>
                </div>
                {(b.address || b.area) && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    {b.area ? `${b.area}${b.address ? ` – ${b.address}` : ''}` : b.address}
                  </div>
                )}
                {b.open_hours && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 shrink-0" />
                    {b.open_hours}
                  </div>
                )}
                {b.phone && (
                  <a
                    href={`tel:${b.phone}`}
                    className="inline-flex items-center gap-2 bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700"
                  >
                    <Phone className="w-4 h-4" />
                    {b.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
