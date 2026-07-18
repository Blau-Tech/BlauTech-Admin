import { supabase } from './supabase'
import { useEffect, useState } from 'react'
import { getAccessClaims, type CityCode, type UserRole } from './authorization'

export type { CityCode, UserRole } from './authorization'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCityLead, setIsCityLead] = useState(false)
  const [userCity, setUserCity] = useState<CityCode | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)

  useEffect(() => {
    const applySession = (session: any) => {
      const sessionUser = session?.user ?? null
      const claims = getAccessClaims(sessionUser)

      setUser(sessionUser)
      setUserRole(claims.role)
      setIsAdmin(claims.isAdmin)
      setIsCityLead(claims.isCityLead)
      setUserCity(claims.city)
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
