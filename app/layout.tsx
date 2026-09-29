import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'BloodConnect – Find Blood Donors Fast',
  description: 'Connect blood donors with patients in need across Dhaka, Bangladesh.',
  manifest: '/manifest.json',
  themeColor: '#dc2626',
  openGraph: {
    title: 'BloodConnect',
    description: 'Find blood donors near you in minutes.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#dc2626',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-white text-gray-900">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
