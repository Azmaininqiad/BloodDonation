'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Fix default Leaflet icon paths (broken in webpack/Next.js)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

function DraggableMarker({ lat, lng, onChange }: Props) {
  const markerRef = useRef<L.Marker | null>(null)

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  return (
    <Marker
      position={[lat, lng]}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const m = markerRef.current
          if (m) {
            const pos = m.getLatLng()
            onChange(pos.lat, pos.lng)
          }
        },
      }}
    />
  )
}

export default function LocationPickerMap({ lat, lng, onChange }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ height: '260px', width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker lat={lat} lng={lng} onChange={onChange} />
    </MapContainer>
  )
}
