'use client'

import { useState, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, Building2 } from 'lucide-react'

interface Hospital {
  id: string
  name: string
  address: string | null
  area: string | null
  latitude: number
  longitude: number
}

interface Props {
  onSelect: (hospital: Hospital | null) => void
  selected: Hospital | null
}

export function HospitalCombobox({ onSelect, selected }: Props) {
  const [query, setQuery] = useState(selected?.name ?? '')
  const [results, setResults] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [notListed, setNotListed] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (q.trim().length < 1) { setResults([]); setLoading(false); return }
      setLoading(true)
      try {
        const res = await fetch(`/api/hospitals/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data)
        setOpen(true)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 250)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (selected) onSelect(null)
    search(val)
  }

  function pick(h: Hospital) {
    onSelect(h)
    setQuery(h.name)
    setOpen(false)
    setNotListed(false)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Type hospital name…"
          className="pl-9"
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}

        {open && results.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
            {results.map((h) => (
              <button
                key={h.id}
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                onMouseDown={() => pick(h)}
              >
                <div className="font-medium">{h.name}</div>
                {(h.address || h.area) && (
                  <div className="text-xs text-gray-500">{h.area ? `${h.area} – ` : ''}{h.address}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
          ✓ {selected.name} selected — location auto-filled
        </p>
      )}

      <button
        type="button"
        className="text-xs text-red-600 hover:underline"
        onClick={() => { setNotListed((v) => !v); onSelect(null); setQuery('') }}
      >
        {notListed ? '← Search hospital list' : 'My hospital is not listed'}
      </button>

      {notListed && (
        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
          Please enter the hospital name below and pick the location on the map.
        </p>
      )}
    </div>
  )
}
