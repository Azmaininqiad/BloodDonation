'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error monitoring (e.g. Sentry) in production
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl mb-4">⚠️</span>
      <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-6 max-w-sm">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} className="bg-red-600 hover:bg-red-700">Try again</Button>
    </div>
  )
}
