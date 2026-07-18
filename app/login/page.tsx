'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { getAccessClaims } from '@/lib/authorization'
import GlassCard from '@/components/ui/GlassCard'
import ErrorBanner from '@/components/ui/ErrorBanner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, isAdmin, isCityLead, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user && (isAdmin || isCityLead)) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, isCityLead, authLoading, router])

  if (authLoading || (user && (isAdmin || isCityLead))) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      const { hasAccess } = getAccessClaims(data.user)

      if (!hasAccess) {
        await supabase.auth.signOut()
        setError('Access denied. Your account does not have permission to access this admin panel.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard variant="strong" className="max-w-md w-full space-y-8 p-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-600 mb-2">
            BlauTech Admin
          </h2>
          <p className="text-sm text-gray-600">
            Sign in to access the admin panel
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <ErrorBanner message={error} onClose={() => setError('')} />
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 glass-input text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500 sm:text-sm transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 glass-input text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500 sm:text-sm transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600/90 backdrop-blur-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
