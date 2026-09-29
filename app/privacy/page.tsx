import { Navbar } from '@/components/Navbar'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12 prose prose-sm">
        <h1>Privacy Policy</h1>
        <p><em>Last updated: September 2026</em></p>
        <h2>What we collect</h2>
        <p>We collect your name, phone number, email, date of birth, weight, blood type, and approximate location to match you with nearby patients.</p>
        <h2>How we use it</h2>
        <p>We use your contact information solely to notify you of nearby blood requests. Your phone number is shared with a patient&apos;s family <strong>only after you confirm</strong> a request. Your exact location is never shown publicly — donors only see a rounded distance.</p>
        <h2>Data retention</h2>
        <p>You may delete your account at any time from the dashboard profile page. All personal data is deleted immediately.</p>
        <h2>Third-party services</h2>
        <p>We use Supabase (database &amp; auth), Resend (email), and Vercel (hosting). Each has its own privacy policy.</p>
        <h2>Contact</h2>
        <p>For any privacy concerns, email: privacy@bloodconnect.app</p>
      </main>
    </>
  )
}
