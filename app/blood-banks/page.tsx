import { Navbar } from '@/components/Navbar'
import { BloodBanksClient } from './BloodBanksClient'

export default function BloodBanksPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏦</div>
          <h1 className="text-2xl font-bold">Nearby Blood Banks</h1>
          <p className="text-gray-500 text-sm mt-1">Find a blood bank near you to donate or collect blood</p>
        </div>
        <BloodBanksClient />
      </main>
    </>
  )
}
