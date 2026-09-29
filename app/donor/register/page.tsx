import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DonorRegisterWizard } from './DonorRegisterWizard'

export default async function DonorRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signup')

  // Check if already registered
  const { data: existing } = await supabase
    .from('donors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl">🩸</span>
          <h1 className="text-2xl font-bold text-red-600 mt-2">Become a Donor</h1>
          <p className="text-gray-500 text-sm">Complete your profile so we can match you with patients nearby.</p>
        </div>
        <DonorRegisterWizard userId={user.id} />
      </div>
    </div>
  )
}
