'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Navbar from './Navbar'
import LoadingSpinner from './ui/LoadingSpinner'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isCityLead } = useAuth()
  const router = useRouter()
  const hasAccess = isAdmin || isCityLead

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!hasAccess) {
        router.push('/unauthorized')
      }
    }
  }, [user, loading, hasAccess, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading..." centered={false} />
      </div>
    )
  }

  if (!user || !hasAccess) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
