import { Navbar } from '@/components/Navbar'
import { RequestStatusClient } from './RequestStatusClient'

export default async function RequestStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <RequestStatusClient requestId={id} token={t ?? ''} />
      </main>
    </>
  )
}
