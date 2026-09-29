'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
      Loading map…
    </div>
  ),
})

interface Props {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

export function LocationPicker({ lat, lng, onChange }: Props) {
  const [locating, setLocating] = useState(false)

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => {
        setLocating(false)
        alert('Could not get your location. Please drag the pin manually.')
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={useCurrentLocation}
        disabled={locating}
        className="flex items-center gap-2"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {locating ? 'Getting location…' : 'Use my current location'}
      </Button>
      <LocationPickerMap lat={lat} lng={lng} onChange={onChange} />
      <p className="text-xs text-gray-500">
        Click on the map or drag the pin to set your location precisely.
        Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  )
}
