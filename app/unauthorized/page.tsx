'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function UnauthorizedPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-xl border border-gray-100 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">
          You don't have admin privileges to access this panel.
        </p>
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

