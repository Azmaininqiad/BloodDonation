export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl" aria-hidden>🩸</span>
          <h1 className="mt-3 text-2xl font-bold text-red-600">BloodConnect</h1>
          <p className="text-gray-500 text-sm mt-1">Connect donors with patients in need</p>
        </div>
        {children}
      </div>
    </div>
  )
}
