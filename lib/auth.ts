import { supabase } from './supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export type UserRole = 'admin' | 'super_admin' | 'city_lead' | null

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCityLead, setIsCityLead] = useState(false)
  const [userCity, setUserCity] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)

  useEffect(() => {
    const applySession = (session: any) => {
      const sessionUser = session?.user ?? null
      const role: UserRole = sessionUser?.user_metadata?.role ?? null
      const city: string | null = sessionUser?.user_metadata?.city ?? null

      setUser(sessionUser)
      setUserRole(role)
      setIsAdmin(role === 'admin' || role === 'super_admin')
      setIsCityLead(role === 'city_lead')
      setUserCity(city)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, isAdmin, isCityLead, userCity, userRole, signOut }
}

export async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return false
  }

  const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.user_metadata?.role === 'super_admin'
  return isAdmin
}
