import { supabase } from './supabase'

// Generic CRUD operations
export async function fetchTable(tableName: string) {
  // Ensure we have an authenticated session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated. Please log in again.')
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error(`Error fetching ${tableName}:`, error)
    // Check if it's an RLS policy issue
    if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error(`Access denied to ${tableName}. Please check Row Level Security (RLS) policies in Supabase. The authenticated user needs SELECT permission.`)
    }
    throw error
  }
  
  return data || []
}

export async function createRecord(tableName: string, record: any) {
  const { data, error } = await supabase.from(tableName).insert(record).select().single()
  if (error) throw error
  return data
}

export async function updateRecord(tableName: string, id: string | number, updates: any) {
  const { data, error } = await supabase
    .from(tableName)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecord(tableName: string, id: string | number) {
  const { error } = await supabase.from(tableName).delete().eq('id', id)
  if (error) throw error
}

// Specific table operations
export const eventsApi = {
  fetch: () => fetchTable('events'),
  create: (event: any) => createRecord('events', event),
  update: (id: string, updates: any) => updateRecord('events', id, updates),
  delete: (id: string) => deleteRecord('events', id),
}

export const hackathonsApi = {
  fetch: () => fetchTable('hackathons'),
  create: (hackathon: any) => createRecord('hackathons', hackathon),
  update: (id: string, updates: any) => updateRecord('hackathons', id, updates),
  delete: (id: string) => deleteRecord('hackathons', id),
}

export const scholarshipsApi = {
  fetch: () => fetchTable('scholarships'),
  create: (scholarship: any) => createRecord('scholarships', scholarship),
  update: (id: string, updates: any) => updateRecord('scholarships', id, updates),
  delete: (id: string) => deleteRecord('scholarships', id),
}

export const signupsApi = {
  fetch: () => fetchTable('signups'),
  delete: (id: string) => deleteRecord('signups', id),
}

// Partner Events API
// Your table is named "partner events" (with a space)
// Supabase JS client has issues with table names containing spaces
// RECOMMENDED: Rename your table in Supabase SQL Editor:
//   ALTER TABLE "partner events" RENAME TO partner_events;
// 
// For now, trying to use the table name with space (may not work with Supabase client)
export const partnerEventsApi = {
  fetch: () => {
    // Try with underscore first (recommended after renaming)
    try {
      return fetchTable('partner_events')
    } catch {
      // Fallback: try with space (may not work)
      return fetchTable('partner events')
    }
  },
  create: (event: any) => {
    try {
      return createRecord('partner_events', event)
    } catch {
      return createRecord('partner events', event)
    }
  },
  update: (id: number, updates: any) => {
    try {
      return updateRecord('partner_events', id, updates)
    } catch {
      return updateRecord('partner events', id, updates)
    }
  },
  delete: (id: number) => {
    try {
      return deleteRecord('partner_events', id)
    } catch {
      return deleteRecord('partner events', id)
    }
  },
}

// Get counts for dashboard statistics
export async function getTableCount(tableName: string): Promise<number> {
  // Ensure we have an authenticated session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.warn(`No session for ${tableName} count`)
    return 0
  }

  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error(`Error counting ${tableName}:`, error)
    // Don't throw for count errors, just return 0 to prevent dashboard from breaking
    return 0
  }
  
  return count || 0
}

export const dashboardStats = {
  getEventsCount: () => getTableCount('events'),
  getHackathonsCount: () => getTableCount('hackathons'),
  getScholarshipsCount: () => getTableCount('scholarships'),
  getSignupsCount: () => getTableCount('signups'),
  getPartnerEventsCount: async () => {
    try {
      return await getTableCount('partner_events')
    } catch {
      return await getTableCount('partner events')
    }
  },
}

