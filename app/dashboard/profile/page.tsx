import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ProfileEditForm } from './ProfileEditForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: donor } = await supabase
    .from('donors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!donor) redirect('/donor/register')

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Edit profile</h1>
        <ProfileEditForm donor={donor} />
      </main>
    </>
  )
}
