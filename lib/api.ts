import { supabase } from './supabase'

// Generic CRUD operations
export async function fetchTable(tableName: string) {
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
    if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error(`Access denied to ${tableName}. Please check Row Level Security (RLS) policies in Supabase. The authenticated user needs SELECT permission.`)
    }
    throw error
  }

  return data || []
}

export async function createRecord(tableName: string, record: any) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated. Please log in again.')
  }

  const { data, error } = await supabase.from(tableName).insert(record).select().single()

  if (error) {
    console.error(`Error creating record in ${tableName}:`, error)

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

    throw new Error(error.message || `Failed to create record in ${tableName}`)
  }

  return data
}

export async function updateRecord(tableName: string, id: string | number, updates: any) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated. Please log in again.')
  }

  // All tables in the new schema have updated_at handled by a trigger,
  // but sending it explicitly is harmless. We omit it to avoid conflicting with the trigger.
  let { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating record in ${tableName}:`, error)

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

// Events (event_type = 'EVENT') -----------------------------------------------
async function fetchEventsFiltered(eventType: 'EVENT' | 'HACKATHON') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated. Please log in again.')

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching events (${eventType}):`, error)
    if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error(`Access denied to events. Please check Row Level Security (RLS) policies in Supabase.`)
    }
    throw error
  }
  return data || []
}

async function countEventsFiltered(eventType: 'EVENT' | 'HACKATHON'): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return 0

  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', eventType)

  if (error) {
    console.error(`Error counting events (${eventType}):`, error)
    return 0
  }
  return count || 0
}

export const eventsApi = {
  fetch: () => fetchEventsFiltered('EVENT'),
  create: (event: any) => createRecord('events', { ...event, event_type: 'EVENT' }),
  update: (id: string, updates: any) => updateRecord('events', id, updates),
  delete: (id: string) => deleteRecord('events', id),
}

export const hackathonsApi = {
  fetch: () => fetchEventsFiltered('HACKATHON'),
  create: (hackathon: any) => createRecord('events', { ...hackathon, event_type: 'HACKATHON' }),
  update: (id: string, updates: any) => updateRecord('events', id, updates),
  delete: (id: string) => deleteRecord('events', id),
}

// Scholarships (flat schema) --------------------------------------------------
export const scholarshipsApi = {
  fetch: () => fetchTable('scholarships'),
  create: (scholarship: any) => createRecord('scholarships', scholarship),
  update: (id: string, updates: any) => updateRecord('scholarships', id, updates),
  delete: (id: string) => deleteRecord('scholarships', id),
}

// Organisations (replaces student_clubs) --------------------------------------
export const organisationsApi = {
  fetch: () => fetchTable('organisations'),
  create: (org: any) => createRecord('organisations', org),
  update: (id: string, updates: any) => updateRecord('organisations', id, updates),
  delete: (id: string) => deleteRecord('organisations', id),
}

// Opportunities (new) ---------------------------------------------------------
export const opportunitiesApi = {
  fetch: () => fetchTable('opportunities'),
  create: (opp: any) => createRecord('opportunities', opp),
  update: (id: string, updates: any) => updateRecord('opportunities', id, updates),
  delete: (id: string) => deleteRecord('opportunities', id),
}

// Dashboard counts ------------------------------------------------------------
export async function getTableCount(tableName: string): Promise<number> {
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
    return 0
  }

  return count || 0
}

export const dashboardStats = {
  getEventsCount: () => countEventsFiltered('EVENT'),
  getHackathonsCount: () => countEventsFiltered('HACKATHON'),
  getScholarshipsCount: () => getTableCount('scholarships'),
  getOpportunitiesCount: () => getTableCount('opportunities'),
  getOrganisationsCount: () => getTableCount('organisations'),
}

// Item name lookups (for link-tracking labels)
export const itemNameApi = {
  async fetchEventNames() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    const { data, error } = await supabase
      .from('events')
      .select('id, name')
      .eq('event_type', 'EVENT')
    if (error) { console.error('Error fetching event names:', error); return [] }
    return (data || []).map((row: any) => ({ id: row.id, name: row.name }))
  },

  async fetchHackathonNames() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    const { data, error } = await supabase
      .from('events')
      .select('id, name')
      .eq('event_type', 'HACKATHON')
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

// Link tracking analytics ----------------------------------------------------
// The old aggregate views (link_clicks_by_platform / link_clicks_by_item)
// no longer exist. We aggregate in JS from raw tables.
export interface TrackedLinkWithStats {
  id: string
  channel: 'WHATSAPP' | 'LINKEDIN' | 'WEBSITE' | 'NEWSLETTER'
  slug: string
  event_id: string
  event_name?: string | null
  click_count: number
  created_at: string
  updated_at: string
}

export interface ClicksByChannel {
  channel: string
  click_count: number
}

export interface ClicksByItem {
  event_id: string
  event_name: string
  click_count: number
}

export const linkTrackingApi = {
  async fetchTrackedLinks(): Promise<TrackedLinkWithStats[]> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const { data, error } = await supabase
      .from('tracked_links')
      .select('*, events(name), link_clicks(count)')
      .order('created_at', { ascending: false })
    if (error) throw error

    return (data || []).map((row: any) => ({
      id: row.id,
      channel: row.channel,
      slug: row.slug,
      event_id: row.event_id,
      event_name: row.events?.name ?? null,
      click_count: row.link_clicks?.[0]?.count ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  },

  async fetchClicksByChannel(): Promise<ClicksByChannel[]> {
    const links = await this.fetchTrackedLinks()
    const byChannel = new Map<string, number>()
    for (const link of links) {
      byChannel.set(link.channel, (byChannel.get(link.channel) || 0) + link.click_count)
    }
    return Array.from(byChannel.entries()).map(([channel, click_count]) => ({ channel, click_count }))
  },

  async fetchClicksByItem(): Promise<ClicksByItem[]> {
    const links = await this.fetchTrackedLinks()
    const byEvent = new Map<string, { name: string; count: number }>()
    for (const link of links) {
      const existing = byEvent.get(link.event_id)
      if (existing) {
        existing.count += link.click_count
      } else {
        byEvent.set(link.event_id, { name: link.event_name || 'Unknown', count: link.click_count })
      }
    }
    return Array.from(byEvent.entries()).map(([event_id, { name, count }]) => ({
      event_id,
      event_name: name,
      click_count: count,
    }))
  },

  async fetchTotalClicks(): Promise<number> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const { count, error } = await supabase
      .from('link_clicks')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  },
}
