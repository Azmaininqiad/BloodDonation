'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Setting { key: string; value: unknown; description: string | null }

export function AdminSettingsForm({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, JSON.stringify(s.value).replace(/^"|"$/g, '')]))
  )
  const [saving, setSaving] = useState<string | null>(null)

  async function saveSetting(key: string) {
    setSaving(key)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: values[key] }),
    })
    const data = await res.json()
    if (data.ok) toast.success(`${key} updated`)
    else toast.error(data.error ?? 'Failed')
    setSaving(null)
  }

  return (
    <div className="space-y-4">
      {settings.map((s) => (
        <div key={s.key} className="flex items-center gap-3 flex-wrap border-b border-gray-100 pb-3 last:border-0">
          <div className="flex-1 min-w-48">
            <Label className="font-mono text-xs text-gray-700">{s.key}</Label>
            {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={values[s.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
              className="w-40 font-mono text-sm"
            />
            <Button
              size="sm"
              onClick={() => saveSetting(s.key)}
              disabled={saving === s.key}
              className="bg-red-600 hover:bg-red-700 shrink-0"
            >
              {saving === s.key ? '…' : 'Save'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
