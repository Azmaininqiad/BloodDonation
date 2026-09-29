'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AdminBloodBankActions({ bankId, isActive }: { bankId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const { error } = await supabase.from('blood_banks').update({ is_active: !isActive }).eq('id', bankId)
    if (error) toast.error(error.message)
    else { toast.success('Updated'); router.refresh() }
    setLoading(false)
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle} disabled={loading} className="text-xs h-7">
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  )
}
