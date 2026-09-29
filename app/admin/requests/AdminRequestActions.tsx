'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

// Admin mutations go through a server endpoint so the secret key stays server-side.
export function AdminRequestActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function act(action: 'expire' | 'cancel') {
    setLoading(action)
    const res = await fetch('/api/admin/requests/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    })
    const data = await res.json()
    if (data.ok) { toast.success(`Request ${action}d`); router.refresh() }
    else toast.error(data.error ?? 'Failed')
    setLoading(null)
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => act('expire')} disabled={!!loading} className="text-xs h-7">
        Expire
      </Button>
      <Button size="sm" variant="outline" onClick={() => act('cancel')} disabled={!!loading} className="text-xs h-7 text-red-600">
        Cancel
      </Button>
    </div>
  )
}
