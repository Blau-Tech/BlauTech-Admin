import { supabase } from './supabase'
import { getAccessClaims } from './authorization'

export async function getPasswordSetupUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403) {
      throw new Error('This setup link is missing or expired. Ask an administrator for a new link.')
    }
    throw new Error('Unable to verify your session. Check your connection and reload this page.')
  }
  if (!user) throw new Error('This setup link is missing or expired. Ask an administrator for a new link.')
  if (!getAccessClaims(user).hasAccess) {
    throw new Error('This account does not have permission to access the admin panel.')
  }
  return user
}

export async function setAdminPassword(password: string, confirmation: string, expectedUserId: string) {
  if (password.length < 12) throw new Error('Use at least 12 characters for your password.')
  if (password !== confirmation) throw new Error('The passwords do not match.')
  const user = await getPasswordSetupUser()
  if (user.id !== expectedUserId) throw new Error('Your signed-in account changed. Reload this page before continuing.')

  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error

  // A sign-out failure must not turn a successful password change into a reported failure.
  try {
    const { error: signOutError } = await supabase.auth.signOut()
    return { signedOut: !signOutError }
  } catch {
    return { signedOut: false }
  }
}
