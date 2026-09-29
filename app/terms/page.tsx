import { Navbar } from '@/components/Navbar'

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12 prose prose-sm">
        <h1>Terms of Service</h1>
        <p><em>Last updated: September 2026</em></p>
        <h2>Medical disclaimer</h2>
        <p>BloodConnect is a coordination platform only. It is <strong>not a medical service</strong>. Final eligibility for donation is determined by qualified medical staff at the donation site. Never donate if you feel unwell.</p>
        <h2>Donor responsibilities</h2>
        <p>By registering, you confirm that the health information you provide is accurate. You understand that false information may endanger a patient&apos;s life.</p>
        <h2>Requester responsibilities</h2>
        <p>Blood requests must be genuine. Abuse of the platform (fake requests, harassment of donors) will result in permanent suspension.</p>
        <h2>Limitation of liability</h2>
        <p>BloodConnect provides no warranty on donor availability or blood compatibility outcomes. We are not liable for any harm arising from a donation or failure to donate.</p>
        <h2>Changes</h2>
        <p>We may update these terms at any time. Continued use of the platform implies acceptance.</p>
      </main>
    </>
  )
}
