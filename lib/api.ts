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
  // Ensure we have an authenticated session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated. Please log in again.')
  }

  const { data, error } = await supabase.from(tableName).insert(record).select().single()
  
  if (error) {
    console.error(`Error creating record in ${tableName}:`, error)
    
    // Handle specific error cases
    if (error.code === '23505') {
      throw new Error('A record with this information already exists.')
    }
    if (error.code === '23503') {
      throw new Error('Invalid reference. Please check related data.')
    }
    if (error.code === '23502') {
      throw new Error('Required field is missing. Please fill in all required fields.')
    }
    if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error(`Access denied. Please check Row Level Security (RLS) policies in Supabase.`)
    }
    if (error.message?.includes('violates check constraint')) {
      throw new Error('Invalid value provided. Please check your input (e.g., status, format, category).')
    }
    
    // Generic error with more context
    throw new Error(error.message || `Failed to create record in ${tableName}`)
  }
  
  return data
}

export async function updateRecord(tableName: string, id: string | number, updates: any) {
  // Ensure we have an authenticated session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated. Please log in again.')
  }

  // Some tables don't have an `updated_at` column; try with it first, then fall back.
  const updatePayloadWithTimestamp = { ...updates, updated_at: new Date().toISOString() }
  let { data, error } = await supabase
    .from(tableName)
    .update(updatePayloadWithTimestamp)
    .eq('id', id)
    .select()
    .single()

  if (
    error &&
    (error.code === '42703' || error.message?.includes('column "updated_at"') || error.message?.includes('updated_at'))
  ) {
    ;({ data, error } = await supabase
      .from(tableName)
      .update({ ...updates })
      .eq('id', id)
      .select()
      .single())
  }
  
  if (error) {
    console.error(`Error updating record in ${tableName}:`, error)
    
    // Handle specific error cases
    if (error.code === 'PGRST116') {
      throw new Error('Record not found. It may have been deleted.')
    }
    if (error.code === '23505') {
      throw new Error('A record with this information already exists.')
    }
    if (error.code === '23502') {
      throw new Error('Required field is missing. Please fill in all required fields.')
    }
    if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error(`Access denied. Please check Row Level Security (RLS) policies in Supabase.`)
    }
    if (error.message?.includes('violates check constraint')) {
      throw new Error('Invalid value provided. Please check your input (e.g., status, format, category).')
    }
    
    throw new Error(error.message || `Failed to update record in ${tableName}`)
  }
  
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
  async fetch() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const { data, error } = await supabase
      .from('scholarships')
      .select('*, scholarship_eligibility(*), scholarship_benefits(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scholarships:', error)
      if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
        throw new Error('Access denied to scholarships. Please check Row Level Security (RLS) policies in Supabase.')
      }
      throw error
    }
    return data || []
  },

  async create(scholarship: any) {
    const { eligibility, benefits, ...baseData } = scholarship
    const created = await createRecord('scholarships', baseData)

    if (eligibility) {
      const { error: elErr } = await supabase
        .from('scholarship_eligibility')
        .insert({ ...eligibility, scholarship_id: created.id })
      if (elErr) console.error('Error creating eligibility:', elErr)
    }

    if (benefits) {
      const { error: bnErr } = await supabase
        .from('scholarship_benefits')
        .insert({ ...benefits, scholarship_id: created.id })
      if (bnErr) console.error('Error creating benefits:', bnErr)
    }

    return created
  },

  async update(id: string, updates: any) {
    const { eligibility, benefits, ...baseUpdates } = updates
    const updated = await updateRecord('scholarships', id, baseUpdates)

    if (eligibility) {
      const { data: existing } = await supabase
        .from('scholarship_eligibility')
        .select('id')
        .eq('scholarship_id', id)
        .single()

      if (existing) {
        await supabase
          .from('scholarship_eligibility')
          .update({ ...eligibility, updated_at: new Date().toISOString() })
          .eq('scholarship_id', id)
      } else {
        await supabase
          .from('scholarship_eligibility')
          .insert({ ...eligibility, scholarship_id: id })
      }
    }

    if (benefits) {
      const { data: existing } = await supabase
        .from('scholarship_benefits')
        .select('id')
        .eq('scholarship_id', id)
        .single()

      if (existing) {
        await supabase
          .from('scholarship_benefits')
          .update({ ...benefits, updated_at: new Date().toISOString() })
          .eq('scholarship_id', id)
      } else {
        await supabase
          .from('scholarship_benefits')
          .insert({ ...benefits, scholarship_id: id })
      }
    }

    return updated
  },

  delete: (id: string) => deleteRecord('scholarships', id),
}

export const signupsApi = {
  fetch: () => fetchTable('signups'),
  delete: (id: string) => deleteRecord('signups', id),
}

export const studentClubsApi = {
  fetch: () => fetchTable('student_clubs'),
  create: (club: any) => createRecord('student_clubs', club),
  update: (id: string | number, updates: any) => updateRecord('student_clubs', id, updates),
  delete: (id: string | number) => deleteRecord('student_clubs', id),
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
}

// Item name lookups (lightweight id+name queries for display)
export const itemNameApi = {
  async fetchEventNames() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    const { data, error } = await supabase.from('events').select('id, name')
    if (error) { console.error('Error fetching event names:', error); return [] }
    return (data || []).map((row: any) => ({ id: row.id, name: row.name }))
  },

  async fetchHackathonNames() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    const { data, error } = await supabase.from('hackathons').select('id, name')
    if (error) { console.error('Error fetching hackathon names:', error); return [] }
    return (data || []).map((row: any) => ({ id: row.id, name: row.name }))
  },

  async fetchScholarshipNames() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    const { data, error } = await supabase.from('scholarships').select('id, title')
    if (error) { console.error('Error fetching scholarship names:', error); return [] }
    return (data || []).map((row: any) => ({ id: row.id, name: row.title }))
  },
}

// Link tracking analytics
export const linkTrackingApi = {
  async fetchClicksByPlatform() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const { data, error } = await supabase
      .from('link_clicks_by_platform')
      .select('*')
    if (error) throw error
    return data || []
  },

  async fetchClicksByItem() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const { data, error } = await supabase
      .from('link_clicks_by_item')
      .select('*')
    if (error) throw error
    return data || []
  },

  async fetchTotalClicks() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const { count, error } = await supabase
      .from('link_clicks')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  },

  async fetchTrackedLinks() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const { data, error } = await supabase
      .from('tracked_links')
      .select('*, link_clicks(count)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
}

