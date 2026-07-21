export type UserRole = 'admin' | 'super_admin' | 'city_lead' | null
export type CityCode = 'MUNICH' | 'BERLIN' | 'MADRID'

export const ADMIN_LINKEDIN_CITIES = ['MUNICH', 'BERLIN'] as const satisfies readonly CityCode[]

const LINKEDIN_WORKFLOW_PATHS = [
  'blau-network-linkedin-events',
  'blau-network-linkedin-hackathons',
] as const

const ALLOWED_WORKFLOW_PATHS = [
  ...LINKEDIN_WORKFLOW_PATHS,
  'blau-network-newsletter',
] as const

export function resolveWorkflowCity(
  isCityLead: boolean,
  assignedCity: CityCode | null,
  selectedCity: CityCode | null
): CityCode | null {
  return isCityLead ? assignedCity : selectedCity
}

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

type AccessClaims = ReturnType<typeof getAccessClaims>

export type WorkflowAuthorization =
  | { allowed: true }
  | { allowed: false; status: 400 | 403 | 404; message: string }

export function isAllowedWorkflowPath(path: string): boolean {
  return (ALLOWED_WORKFLOW_PATHS as readonly string[]).includes(path)
}

export function resolveN8nWorkflowPath(path: string, city: unknown): string {
  if (!(LINKEDIN_WORKFLOW_PATHS as readonly string[]).includes(path) || city === 'BERLIN') {
    return path
  }

  return `${path}-stable`
}

export function authorizeWorkflowRequest(
  path: string,
  payload: unknown,
  claims: AccessClaims
): WorkflowAuthorization {
  if (!isAllowedWorkflowPath(path)) {
    return { allowed: false, status: 404, message: 'Workflow not found.' }
  }

  if (!claims.hasAccess) {
    return { allowed: false, status: 403, message: 'You do not have permission to trigger workflows.' }
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload) ||
    typeof (payload as Record<string, unknown>).test_mode !== 'boolean'
  ) {
    return { allowed: false, status: 400, message: 'test_mode must be true or false.' }
  }

  if (path === 'blau-network-newsletter') {
    return claims.isAdmin
      ? { allowed: true }
      : { allowed: false, status: 403, message: 'Only admins can trigger the newsletter workflow.' }
  }

  const city = (payload as Record<string, unknown>).city

  if (city !== 'MUNICH' && city !== 'BERLIN' && city !== 'MADRID') {
    return { allowed: false, status: 400, message: 'A valid city is required.' }
  }

  if (claims.isCityLead) {
    return city === claims.city
      ? { allowed: true }
      : { allowed: false, status: 403, message: 'City leads can only trigger workflows for their assigned city.' }
  }

  return (ADMIN_LINKEDIN_CITIES as readonly string[]).includes(city)
    ? { allowed: true }
    : { allowed: false, status: 400, message: 'Madrid LinkedIn routing is not available for admins.' }
}
