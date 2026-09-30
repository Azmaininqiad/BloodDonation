import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { NewRequestForm } from './NewRequestForm'

export default function NewRequestPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-600">Find blood donors</h1>
          <p className="text-gray-700 text-sm mt-1">
            Fill in the details below. No account needed. Nearby donors will be notified immediately.
          </p>
        </div>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <NewRequestForm />
          </CardContent>
        </Card>
        <p className="text-xs text-gray-600 mt-6 text-center">
          By submitting you agree to our{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
          We only use your contact to coordinate the donation.
        </p>
      </main>
    </div>
  )
}
