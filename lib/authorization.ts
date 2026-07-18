export type UserRole = 'admin' | 'super_admin' | 'city_lead' | null
export type CityCode = 'MUNICH' | 'BERLIN' | 'MADRID'

type AuthUser = {
  app_metadata?: Record<string, unknown> | null
} | null | undefined

export function getAccessClaims(user: AuthUser) {
  const roleValue = user?.app_metadata?.role
  const cityValue = user?.app_metadata?.city

  const role: UserRole =
    roleValue === 'admin' || roleValue === 'super_admin' || roleValue === 'city_lead'
      ? roleValue
      : null

  const city: CityCode | null =
    cityValue === 'MUNICH' || cityValue === 'BERLIN' || cityValue === 'MADRID'
      ? cityValue
      : null

  const isAdmin = role === 'admin' || role === 'super_admin'
  const isCityLead = role === 'city_lead' && city !== null

  return {
    role,
    city: isCityLead ? city : null,
    isAdmin,
    isCityLead,
    hasAccess: isAdmin || isCityLead,
  }
}
