'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GlassCard from '@/components/ui/GlassCard'
import ErrorBanner from '@/components/ui/ErrorBanner'
import SuccessBanner from '@/components/ui/SuccessBanner'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getPasswordSetupUser, setAdminPassword } from '@/lib/passwordSetup'

export default function SetPasswordPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ signedOut: boolean } | null>(null)

  useEffect(() => {
    let active = true
    async function checkSession() {
      try {
        const url = new URL(window.location.href)
        if (url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error')) {
          throw new Error('This setup link is invalid or expired. Ask an administrator for a new link.')
        }
        const verifiedUser = await getPasswordSetupUser()
        if (active) setUser(verifiedUser)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to verify your session. Reload this page to try again.')
      } finally {
        if (active) setChecking(false)
      }
    }
    void checkSession()
    return () => { active = false }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!user || saving) return
    setError('')
    setSaving(true)
    try {
      setResult(await setAdminPassword(password, confirmation, user.id))
      setPassword('')
      setConfirmation('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard variant="strong" className="max-w-md w-full space-y-6 p-10">
        <h1 className="text-3xl font-bold text-primary-600">Set your admin password</h1>
        <div role="alert"><ErrorBanner message={error} /></div>
        {checking ? <LoadingSpinner label="Checking your setup link..." /> : result ? (
          <div className="space-y-4" role="status">
            <SuccessBanner message="Your password has been saved." />
            {result.signedOut ? (
              <p className="text-sm text-gray-600">Sign in with your email and new password to verify access.</p>
            ) : (
              <p className="text-sm text-gray-600">We could not sign you out. Open the <Link href="/dashboard" className="text-primary-600 underline">dashboard</Link> and sign out before testing your new password.</p>
            )}
          </div>
        ) : user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">Choose a password for <strong>{user.email}</strong>. Use at least 12 characters.</p>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} disabled={saving} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={12} disabled={saving} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <button type="submit" disabled={saving} className="w-full px-4 py-3 rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Saving...' : 'Save password'}</button>
          </form>
        )}
        {!checking && <Link href="/login" className="block text-sm text-primary-600 underline">Go to sign in</Link>}
      </GlassCard>
    </div>
  )
}
