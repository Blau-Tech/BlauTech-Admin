import { supabase } from './supabase'

// Tables where city is a single text column (vs. an array)
const SINGLE_CITY_TABLES = new Set(['events', 'organisations'])
// Tables where the city is stored as an array column called `cities`
const MULTI_CITY_TABLES = new Set(['scholarships', 'opportunities'])

function applyCityFilter(query: any, tableName: string, cityFilter?: string) {
  if (!cityFilter) return query
  if (SINGLE_CITY_TABLES.has(tableName)) {
    return query.eq('city', cityFilter)
  }
  if (MULTI_CITY_TABLES.has(tableName)) {
    return query.contains('cities', [cityFilter])
  }
  return query
}

// Generic CRUD operations
export async function fetchTable(tableName: string, cityFilter?: string) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated. Please log in again.')
  }

  let query = supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false })

  query = applyCityFilter(query, tableName, cityFilter)

  const { data, error } = await query

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
async function fetchEventsFiltered(eventType: 'EVENT' | 'HACKATHON', cityFilter?: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated. Please log in again.')

  let query = supabase
    .from('events')
    .select('*')
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })

  if (cityFilter) {
    query = query.eq('city', cityFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error fetching events (${eventType}):`, error)
    if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error(`Access denied to events. Please check Row Level Security (RLS) policies in Supabase.`)
    }
    throw error
  }
  return data || []
}

async function countEventsFiltered(eventType: 'EVENT' | 'HACKATHON', cityFilter?: string): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return 0

  let query = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', eventType)

  if (cityFilter) {
    query = query.eq('city', cityFilter)
  }

  const { count, error } = await query

  if (error) {
    console.error(`Error counting events (${eventType}):`, error)
    return 0
  }
  return count || 0
}

export const eventsApi = {
  fetch: (cityFilter?: string) => fetchEventsFiltered('EVENT', cityFilter),
  create: (event: any) => createRecord('events', { ...event, event_type: 'EVENT' }),
  update: (id: string, updates: any) => updateRecord('events', id, updates),
  delete: (id: string) => deleteRecord('events', id),
}

export const hackathonsApi = {
  fetch: (cityFilter?: string) => fetchEventsFiltered('HACKATHON', cityFilter),
  create: (hackathon: any) => createRecord('events', { ...hackathon, event_type: 'HACKATHON' }),
  update: (id: string, updates: any) => updateRecord('events', id, updates),
  delete: (id: string) => deleteRecord('events', id),
}

// Scholarships (flat schema) --------------------------------------------------
export const scholarshipsApi = {
  fetch: (cityFilter?: string) => fetchTable('scholarships', cityFilter),
  create: (scholarship: any) => createRecord('scholarships', scholarship),
  update: (id: string, updates: any) => updateRecord('scholarships', id, updates),
  delete: (id: string) => deleteRecord('scholarships', id),
}

// Organisations (replaces student_clubs) --------------------------------------
export const organisationsApi = {
  fetch: (cityFilter?: string) => fetchTable('organisations', cityFilter),
  create: (org: any) => createRecord('organisations', org),
  update: (id: string, updates: any) => updateRecord('organisations', id, updates),
  delete: (id: string) => deleteRecord('organisations', id),
}

// Opportunities (new) ---------------------------------------------------------
export const opportunitiesApi = {
  fetch: (cityFilter?: string) => fetchTable('opportunities', cityFilter),
  create: (opp: any) => createRecord('opportunities', opp),
  update: (id: string, updates: any) => updateRecord('opportunities', id, updates),
  delete: (id: string) => deleteRecord('opportunities', id),
}

// Dashboard counts ------------------------------------------------------------
export async function getTableCount(tableName: string, cityFilter?: string): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.warn(`No session for ${tableName} count`)
    return 0
  }

  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })

  query = applyCityFilter(query, tableName, cityFilter)

  const { count, error } = await query

  if (error) {
    console.error(`Error counting ${tableName}:`, error)
    return 0
  }

  return count || 0
}

export const dashboardStats = {
  getEventsCount: (cityFilter?: string) => countEventsFiltered('EVENT', cityFilter),
  getHackathonsCount: (cityFilter?: string) => countEventsFiltered('HACKATHON', cityFilter),
  getScholarshipsCount: (cityFilter?: string) => getTableCount('scholarships', cityFilter),
  getOpportunitiesCount: (cityFilter?: string) => getTableCount('opportunities', cityFilter),
  getOrganisationsCount: (cityFilter?: string) => getTableCount('organisations', cityFilter),
}

// Item name lookups (for link-tracking labels)
export const itemNameApi = {
  async fetchEventNames(cityFilter?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    let query = supabase
      .from('events')
      .select('id, name')
      .eq('event_type', 'EVENT')
    if (cityFilter) query = query.eq('city', cityFilter)
    const { data, error } = await query
    if (error) { console.error('Error fetching event names:', error); return [] }
    return (data || []).map((row: any) => ({ id: row.id, name: row.name }))
  },

  async fetchHackathonNames(cityFilter?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    let query = supabase
      .from('events')
      .select('id, name')
      .eq('event_type', 'HACKATHON')
    if (cityFilter) query = query.eq('city', cityFilter)
    const { data, error } = await query
    if (error) { console.error('Error fetching hackathon names:', error); return [] }
    return (data || []).map((row: any) => ({ id: row.id, name: row.name }))
  },

  async fetchScholarshipNames(cityFilter?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return []
    let query = supabase.from('scholarships').select('id, title')
    if (cityFilter) query = query.contains('cities', [cityFilter])
    const { data, error } = await query
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
  event_id?: string | null
  scholarship_id?: string | null
  opportunity_id?: string | null
  entity_id: string
  entity_type: 'EVENT' | 'HACKATHON' | 'SCHOLARSHIP' | 'OPPORTUNITY'
  entity_name?: string | null
  entity_city?: string | null
  event_name?: string | null
  event_city?: string | null
  click_count: number
  created_at: string
  updated_at: string
}

export interface ClicksByChannel {
  channel: string
  click_count: number
}

export interface ClicksByItem {
  entity_id: string
  entity_name: string
  entity_type: TrackedLinkWithStats['entity_type']
  click_count: number
}

function formatCityScope(cities?: string[] | null): string | null {
  if (!cities || cities.length === 0) return 'GLOBAL'
  return cities.join(', ')
}

export const linkTrackingApi = {
  async fetchTrackedLinks(cityFilter?: string): Promise<TrackedLinkWithStats[]> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    const city = cityFilter?.toUpperCase()
    const query = supabase
      .from('tracked_links')
      .select('*, events(name, city, event_type), scholarships(title, cities), opportunities(title, cities), link_clicks(count)')
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    const rows = city
      ? (data || []).filter((row: any) => {
          if (row.events?.city) return row.events.city === city
          const scholarshipCities = row.scholarships?.cities || []
          if (row.scholarships) return scholarshipCities.length === 0 || scholarshipCities.includes(city)
          const opportunityCities = row.opportunities?.cities || []
          if (row.opportunities) return opportunityCities.length === 0 || opportunityCities.includes(city)
          return false
        })
      : (data || [])

    return rows.map((row: any) => {
      const entityType: TrackedLinkWithStats['entity_type'] = row.event_id
        ? row.events?.event_type === 'HACKATHON' ? 'HACKATHON' : 'EVENT'
        : row.scholarship_id
          ? 'SCHOLARSHIP'
          : 'OPPORTUNITY'
      const entityId = row.event_id || row.scholarship_id || row.opportunity_id || row.id
      const entityName =
        row.events?.name ||
        row.scholarships?.title ||
        row.opportunities?.title ||
        null
      const entityCity =
        row.events?.city ||
        formatCityScope(row.scholarships?.cities || row.opportunities?.cities) ||
        null

      return {
        id: row.id,
        channel: row.channel,
        slug: row.slug,
        event_id: row.event_id,
        scholarship_id: row.scholarship_id,
        opportunity_id: row.opportunity_id,
        entity_id: entityId,
        entity_type: entityType,
        entity_name: entityName,
        entity_city: entityCity,
        event_name: entityName,
        event_city: entityCity,
        click_count: row.link_clicks?.[0]?.count ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    })
  },

  async fetchClicksByChannel(cityFilter?: string): Promise<ClicksByChannel[]> {
    const links = await this.fetchTrackedLinks(cityFilter)
    const byChannel = new Map<string, number>()
    for (const link of links) {
      byChannel.set(link.channel, (byChannel.get(link.channel) || 0) + link.click_count)
    }
    return Array.from(byChannel.entries()).map(([channel, click_count]) => ({ channel, click_count }))
  },

  async fetchClicksByItem(cityFilter?: string): Promise<ClicksByItem[]> {
    const links = await this.fetchTrackedLinks(cityFilter)
    const byItem = new Map<string, { name: string; type: TrackedLinkWithStats['entity_type']; count: number }>()
    for (const link of links) {
      const existing = byItem.get(link.entity_id)
      if (existing) {
        existing.count += link.click_count
      } else {
        byItem.set(link.entity_id, {
          name: link.entity_name || 'Unknown',
          type: link.entity_type,
          count: link.click_count,
        })
      }
    }
    return Array.from(byItem.entries()).map(([entity_id, { name, type, count }]) => ({
      entity_id,
      entity_name: name,
      entity_type: type,
      click_count: count,
    }))
  },

  async fetchTotalClicks(cityFilter?: string): Promise<number> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated. Please log in again.')

    if (!cityFilter) {
      const { count, error } = await supabase
        .from('link_clicks')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count || 0
    }

    // For city leads, aggregate click counts from city-filtered tracked links.
    const links = await this.fetchTrackedLinks(cityFilter)
    return links.reduce((sum, link) => sum + (link.click_count || 0), 0)
  },
}

/**
 * Trigger an n8n workflow via a POST request.
 * @param path    - The n8n webhook endpoint path
 * @param payload - Any JSON-serializable body to send with the request
 */
export async function triggerWorkflow(path: string, payload: unknown = {}): Promise<void> {
  const url = `/api/workflows/${path.replace(/^\/+/, '')}`
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Not authenticated. Please log in again.')
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || response.statusText || 'Workflow request failed.')
  }
}
