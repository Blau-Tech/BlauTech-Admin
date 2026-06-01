import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check admin status from auth user_metadata
// (The new Blautech Network schema has no `users` table; roles live in
// Supabase Auth `user_metadata.role`.)
export async function checkAdminFromMetadata(): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return false
  }

  return user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin'
}
