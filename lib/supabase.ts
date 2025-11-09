import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  // Check if user has admin role
  // You can adjust this based on your Supabase auth setup
  // Common approaches: check user metadata, or a separate users table with roles
  return data.role === 'admin' || data.role === 'super_admin'
}

// Alternative: Check user metadata for admin role
export async function checkAdminFromMetadata(userId: string): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return false
  }

  // Check user metadata for admin role
  return user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin'
}

