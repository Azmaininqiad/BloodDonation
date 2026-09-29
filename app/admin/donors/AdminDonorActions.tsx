'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props { donorId: string; isActive: boolean }

export function AdminDonorActions({ donorId, isActive }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const { error } = await supabase.from('donors').update({ is_active: !isActive }).eq('id', donorId)
    if (error) toast.error(error.message)
    else { toast.success(isActive ? 'Donor banned' : 'Donor restored'); router.refresh() }
    setLoading(false)
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle} disabled={loading} className="text-xs h-7">
      {isActive ? 'Ban' : 'Restore'}
    </Button>
  )
}
