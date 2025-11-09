import { supabase } from './supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAdmin(session?.user?.user_metadata?.role === 'admin' || session?.user?.user_metadata?.role === 'super_admin')
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAdmin(session?.user?.user_metadata?.role === 'admin' || session?.user?.user_metadata?.role === 'super_admin')
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, isAdmin, signOut }
}

export async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return false
  }

  const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.user_metadata?.role === 'super_admin'
  return isAdmin
}

