'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import EventForm from '@/components/EventForm'
import EventDetailView from '@/components/EventDetailView'
import { toast } from 'sonner'
import { eventsApi, triggerWorkflow } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import GlassCard from '@/components/ui/GlassCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBanner from '@/components/ui/ErrorBanner'
import SuccessBanner from '@/components/ui/SuccessBanner'
import SearchBar from '@/components/ui/SearchBar'
import Badge from '@/components/ui/Badge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { format, isToday, isTomorrow, startOfDay, isPast } from 'date-fns'

type ViewMode = 'card' | 'table' | 'chronological'
type CityName = 'MUNICH' | 'BERLIN' | 'MADRID'

const CITY_OPTIONS: CityName[] = ['MUNICH', 'BERLIN', 'MADRID']

export default function EventsPage() {
  const { isAdmin, isCityLead, userCity, loading: authLoading } = useAuth()
  const cityFilter = isCityLead ? userCity ?? undefined : undefined
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [viewingEvent, setViewingEvent] = useState<any>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortAscending, setSortAscending] = useState(true) // true = earliest first, false = latest first
  const [hidePastEvents, setHidePastEvents] = useState(true)
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  // Boolean filters - when true, show only events where that attribute is NOT set
  const [filterNotHighlighted, setFilterNotHighlighted] = useState(false)
  const [filterNotLinkedIn, setFilterNotLinkedIn] = useState(false)
  const [filterNotWhatsApp, setFilterNotWhatsApp] = useState(false)
  const [filterNotNewsletter, setFilterNotNewsletter] = useState(false)

  // Link form (POST source, link, and routing city)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkCity, setLinkCity] = useState<CityName | ''>('')
  const [linkSubmitting, setLinkSubmitting] = useState(false)
  const [linkMessage, setLinkMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    if (authLoading) return
    loadEvents()
  }, [authLoading, cityFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await eventsApi.fetch(cityFilter)
      setEvents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const [linkedInConfirmOpen, setLinkedInConfirmOpen] = useState(false)

  const confirmLinkedInPost = async () => {
    const toastId = toast.loading('Generating Events LinkedIn draft…')
    try {
      await triggerWorkflow('blau-network-linkedin-events', (userCity || '').toUpperCase())
      toast.success('Events LinkedIn draft generation started!', { id: toastId })
    } catch (err: any) {
      toast.error('Failed to generate Events LinkedIn draft', {
        id: toastId,
        description: err.message || 'Something went wrong. Please try again.',
      })
    } finally {
      setLinkedInConfirmOpen(false)
    }
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleViewDetails = (event: any) => {
    setViewingEvent(event)
    setIsDetailModalOpen(true)
  }

  const handleDelete = async (event: any) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"?`)) {
      return
    }

    try {
      await eventsApi.delete(event.id)
      await loadEvents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleHighlight = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening detail view
    try {
      await eventsApi.update(event.id, { is_highlight: !event.is_highlight })
      await loadEvents()
    } catch (err: any) {
      setError(err.message || 'Failed to update highlight status')
    }
  }

  const handleTogglePartnerEvent = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening detail view
    try {
      await eventsApi.update(event.id, { partner_event: !event.partner_event })
      await loadEvents()
    } catch (err: any) {
      setError(err.message || 'Failed to update partner event status')
    }
  }

  // Human-readable label for the format enum (IN_PERSON, ONLINE, HYBRID).
  const formatFormatLabel = (value: string | null | undefined): string => {
    if (!value) return ''
    switch (value) {
      case 'IN_PERSON': return 'In-Person'
      case 'ONLINE': return 'Online'
      case 'HYBRID': return 'Hybrid'
      default: return value
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      setError('')
      setSuccessMessage('')
      
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, data)
        setSuccessMessage('Event updated successfully!')
      } else {
        await eventsApi.create(data)
        setSuccessMessage('Event created successfully!')
      }
      
      // Close modal and reload after a short delay to show success message
      setTimeout(() => {
        setIsModalOpen(false)
        setEditingEvent(null)
        setSuccessMessage('')
        loadEvents()
      }, 1000)
    } catch (err: any) {
      console.error('Error saving event:', err)
      // Error will be displayed in the form component
      throw err // Re-throw so form can handle it
    }
  }

  const handleSubmitLink = async (e: React.FormEvent) => {

    const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    e.preventDefault()
    setLinkMessage(null)
    if (!linkUrl.trim()) {
      setLinkMessage({ type: 'error', text: 'Please enter a link.' })
      return
    }

    const city = isCityLead ? userCity?.trim().toUpperCase() : linkCity
    if (!city || !CITY_OPTIONS.includes(city as CityName)) {
      setLinkMessage({ type: 'error', text: 'Please select a valid city.' })
      return
    }

    try {
      setLinkSubmitting(true)
      // TODO: Adjust the exact n8n url + path
      const res = await fetch(url + '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source: 'admin',
          event_link: linkUrl.trim(),
          city,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || res.statusText || 'Request failed')
      }
      setLinkMessage({ type: 'success', text: 'Link submitted successfully.' })
      setLinkUrl('')
      if (isAdmin) setLinkCity('')
    } catch (err: any) {
      setLinkMessage({ type: 'error', text: err.message || 'Failed to submit link.' })
    } finally {
      setLinkSubmitting(false)
    }
  }

  // Helper function to format date and time
  const formatEventDateTime = (event: any) => {
    if (!event.start_date) return '-'
    const dateStr = format(new Date(event.start_date), 'PP')
    if (event.start_time) {
      // Format time from HH:MM:SS or HH:MM to HH:MM
      const timeStr = event.start_time.split(':').slice(0, 2).join(':')
      return `${dateStr} at ${timeStr}`
    }
    return dateStr
  }

  // Helper function to format date for chronological view
  const formatDateLabel = (date: Date) => {
    if (isToday(date)) {
      return 'Today'
    } else if (isTomorrow(date)) {
      return 'Tomorrow'
    } else {
      return format(date, 'MMM d')
    }
  }

  const formatDayOfWeek = (date: Date) => {
    return format(date, 'EEEE')
  }

  // Sort events by date/time for all view modes
  const compareEventsByDateTime = (a: any, b: any) => {
    const aHasDate = !!a?.start_date
    const bHasDate = !!b?.start_date

    // Put undated events last
    if (aHasDate && !bHasDate) return -1
    if (!aHasDate && bHasDate) return 1
    if (!aHasDate && !bHasDate) {
      return (a?.name || '').toString().localeCompare((b?.name || '').toString())
    }

    const aDate = startOfDay(new Date(a.start_date))
    const bDate = startOfDay(new Date(b.start_date))
    const dayDiff = aDate.getTime() - bDate.getTime()
    if (dayDiff !== 0) return dayDiff

    const aHasTime = !!a?.start_time
    const bHasTime = !!b?.start_time

    // For same date: show timed events before "all-day/unknown time" events
    if (aHasTime && !bHasTime) return -1
    if (!aHasTime && bHasTime) return 1
    if (aHasTime && bHasTime) {
      const timeDiff = a.start_time.localeCompare(b.start_time)
      if (timeDiff !== 0) return timeDiff
    }

    // Stable-ish tie-breakers
    return (a?.name || '').toString().localeCompare((b?.name || '').toString())
  }

  const eventsLinkedInPreview = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return events
      .filter((e: any) =>
        e.is_highlight &&
        !e.posted_linkedin &&
        (!e.signup_deadline || new Date(e.signup_deadline) >= today)
      )
      .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 4)
      .map((e: any) => ({ id: e.id, name: e.name, start_date: e.start_date, city: e.city }))
  }, [events])

  // Filter events based on search and boolean filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    // City filter (admin only — city leads already see city-scoped data)
    if (selectedCity) {
      filtered = filtered.filter((event) => event.city === selectedCity)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((event) => {
        const name = (event.name || '').toLowerCase()
        const description = (event.description || '').toLowerCase()
        const location = (event.location || '').toLowerCase()
        const organisers = (event.organisers || '').toLowerCase()
        return (
          name.includes(query) ||
          description.includes(query) ||
          location.includes(query) ||
          organisers.includes(query)
        )
      })
    }

    // Hide past events filter
    if (hidePastEvents) {
      filtered = filtered.filter((event) => {
        if (!event.start_date) return true // Keep events without dates
        const eventDate = new Date(event.start_date)
        // Consider event as past if the date (without time) is before today
        return !isPast(startOfDay(eventDate))
      })
    }

    // Boolean filters - show only events where the attribute is NOT set
    if (filterNotHighlighted) {
      filtered = filtered.filter((event) => !event.is_highlight)
    }
    if (filterNotLinkedIn) {
      filtered = filtered.filter((event) => !event.posted_linkedin)
    }
    if (filterNotWhatsApp) {
      filtered = filtered.filter((event) => !event.posted_whatsapp)
    }
    if (filterNotNewsletter) {
      filtered = filtered.filter((event) => !event.posted_newsletter)
    }

    return filtered
  }, [events, searchQuery, selectedCity, hidePastEvents, filterNotHighlighted, filterNotLinkedIn, filterNotWhatsApp, filterNotNewsletter])

  const sortedFilteredEvents = useMemo(() => {
    const sorted = [...filteredEvents].sort(compareEventsByDateTime)
    // Reverse if sorting descending (latest first)
    return sortAscending ? sorted : sorted.reverse()
  }, [filteredEvents, sortAscending])

  // Group filtered events by date for chronological view
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    sortedFilteredEvents.forEach((event) => {
      if (event.start_date) {
        const date = startOfDay(new Date(event.start_date))
        const dateKey = date.toISOString()
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(event)
      }
    })
    
    // Sort dates and events within each date
    const sortedDates = Object.keys(grouped).sort(
      (a, b) => sortAscending 
        ? new Date(a).getTime() - new Date(b).getTime()
        : new Date(b).getTime() - new Date(a).getTime()
    )
    const result: Array<{ date: Date; events: any[] }> = []
    sortedDates.forEach((dateKey) => {
      result.push({
        date: new Date(dateKey),
        events: grouped[dateKey].sort(compareEventsByDateTime),
      })
    })
    return result
  }, [sortedFilteredEvents, sortAscending])

  const tableColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {row.is_highlight && (
              <span className="text-yellow-500" title="Highlighted">⭐</span>
            )}
            {value || '-'}
          </div>
          {row.description && (
            <div className="text-sm text-gray-500 mt-1 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'start_date',
      label: 'Date & Time',
      render: (value: any, row: any) => formatEventDateTime(row),
    },
    { key: 'location', label: 'Location' },
    { key: 'organisers', label: 'Organisers' },
    {
      key: 'format',
      label: 'Format',
      render: (value: any) => value ? <Badge color="blue" size="sm">{formatFormatLabel(value)}</Badge> : '-',
    },
  ]

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading events..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {error && <ErrorBanner message={error} onClose={() => setError('')} className="mb-4" />}
        {successMessage && <SuccessBanner message={successMessage} className="mb-4" />}
        
        {/* Header */}
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            {filteredEvents.length !== events.length && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredEvents.length} of {events.length} events
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center gap-3">
            {/* View Toggle Buttons */}
            <div className="flex items-center gap-1 glass-subtle rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'card'
                    ? 'bg-white/70 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white/40'
                }`}
                title="Card View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white/70 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white/40'
                }`}
                title="Table View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('chronological')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'chronological'
                    ? 'bg-white/70 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white/40'
                }`}
                title="Chronological View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
                onClick={() => setLinkedInConfirmOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#0077B5]/90 backdrop-blur-sm px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#005f8e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0077B5] transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Generate LinkedIn Draft
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="block rounded-xl bg-primary-600/90 backdrop-blur-sm px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all"
            >
              Add Event
            </button>
          </div>
        </div>

        {/* Link submission form */}
        <GlassCard variant="subtle" className="mb-6 p-4">
          <form onSubmit={handleSubmitLink} className="flex flex-wrap items-center gap-3">
            <Input
              id="link-url"
              type="url"
              placeholder="Paste link (URL)..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={linkSubmitting}
              className="flex-1 min-w-[200px]"
            />
            {isAdmin && (
              <select
                id="link-city"
                aria-label="Submission city"
                value={linkCity}
                onChange={(e) => setLinkCity(e.target.value as CityName | '')}
                disabled={linkSubmitting}
                className="rounded-xl glass-input px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500"
              >
                <option value="">Select city…</option>
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>
                    {city.charAt(0) + city.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            )}
            {isCityLead && (
              <span className="rounded-xl glass-input px-4 py-2.5 text-sm text-gray-700">
                City: {userCity || 'Not assigned'}
              </span>
            )}
            <button
              type="submit"
              disabled={linkSubmitting}
              className="rounded-xl bg-primary-600/90 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:ring-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {linkSubmitting ? 'Submitting…' : 'Submit link'}
            </button>
          </form>
          {linkMessage && (
            <p className={`mt-2 text-sm ${linkMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {linkMessage.text}
            </p>
          )}
        </GlassCard>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search events by title, description, location, or organizer..."
          className="mb-4"
        />

        {/* Filters */}
        <div className="mb-6">
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">City:</span>
              {(['MUNICH', 'BERLIN', 'MADRID'] as const).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                    selectedCity === city
                      ? 'bg-indigo-100/80 text-indigo-800 ring-2 ring-indigo-300/60 shadow-sm'
                      : 'bg-white/40 text-gray-700 hover:bg-white/60 ring-1 ring-white/40'
                  }`}
                >
                  {city.charAt(0) + city.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <button
              type="button"
              onClick={() => setSortAscending(!sortAscending)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                sortAscending
                  ? 'bg-blue-100/80 text-blue-800 ring-2 ring-blue-300/60 shadow-sm'
                  : 'bg-white/40 text-gray-700 hover:bg-white/60 ring-1 ring-white/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              {sortAscending ? 'Earliest First' : 'Latest First'}
            </button>
            <button
              type="button"
              onClick={() => setHidePastEvents(!hidePastEvents)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                hidePastEvents
                  ? 'bg-green-100/80 text-green-800 ring-2 ring-green-300/60 shadow-sm'
                  : 'bg-white/40 text-gray-700 hover:bg-white/60 ring-1 ring-white/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Hide Past Events
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Show only:</span>
            <button
              type="button"
              onClick={() => setFilterNotHighlighted(!filterNotHighlighted)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                filterNotHighlighted
                  ? 'bg-green-100/80 text-green-800 ring-2 ring-green-300/60 shadow-sm'
                  : 'bg-white/40 text-gray-700 hover:bg-white/60 ring-1 ring-white/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Not Highlighted
            </button>
            <button
              type="button"
              onClick={() => setFilterNotLinkedIn(!filterNotLinkedIn)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                filterNotLinkedIn
                  ? 'bg-green-100/80 text-green-800 ring-2 ring-green-300/60 shadow-sm'
                  : 'bg-white/40 text-gray-700 hover:bg-white/60 ring-1 ring-white/40'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              Not on LinkedIn
            </button>
            <button
              type="button"
              onClick={() => setFilterNotWhatsApp(!filterNotWhatsApp)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                filterNotWhatsApp
                  ? 'bg-green-100/80 text-green-800 ring-2 ring-green-300/60 shadow-sm'
                  : 'bg-white/40 text-gray-700 hover:bg-white/60 ring-1 ring-white/40'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              Not on WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setFilterNotNewsletter(!filterNotNewsletter)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                filterNotNewsletter
                  ? 'bg-green-100/80 text-green-800 ring-2 ring-green-300/60 shadow-sm'
                  : 'bg-white/40 text-gray-700 hover:bg-white/60 ring-1 ring-white/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Not in Newsletter
            </button>
            {(filterNotHighlighted || filterNotLinkedIn || filterNotWhatsApp || filterNotNewsletter || hidePastEvents || selectedCity) && (
              <button
                type="button"
                onClick={() => {
                  setFilterNotHighlighted(false)
                  setFilterNotLinkedIn(false)
                  setFilterNotWhatsApp(false)
                  setFilterNotNewsletter(false)
                  setHidePastEvents(false)
                  setSelectedCity(null)
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Events Display - Conditional Rendering */}
        {filteredEvents.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-500">
              {events.length === 0
                ? 'No events available'
                : 'No events match your search criteria or filters'}
            </p>
            {(searchQuery || filterNotHighlighted || filterNotLinkedIn || filterNotWhatsApp || filterNotNewsletter || hidePastEvents || selectedCity) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterNotHighlighted(false)
                  setFilterNotLinkedIn(false)
                  setFilterNotWhatsApp(false)
                  setFilterNotNewsletter(false)
                  setHidePastEvents(false)
                  setSelectedCity(null)
                }}
                className="mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Clear search and filters
              </button>
            )}
          </GlassCard>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {sortedFilteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleViewDetails(event)}
                className={`group relative rounded-3xl backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer border hover:-translate-y-1 ${
                  event.is_highlight
                    ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl shadow-yellow-200/30 shadow-lg'
                    : event.partner_event
                    ? 'bg-gradient-to-br from-blue-100/60 to-sky-100/60 border-blue-300/70 hover:border-blue-400 hover:shadow-xl shadow-blue-200/30 shadow-lg'
                    : 'glass hover:shadow-xl hover:bg-white/70'
                }`}
              >
                {/* Toggle buttons: Partner Event (blue) + Highlight (yellow) */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button
                    onClick={(e) => handleTogglePartnerEvent(event, e)}
                    className={`p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${
                      event.partner_event
                        ? 'bg-blue-400/90 text-blue-900 hover:bg-blue-500 shadow-md ring-1 ring-blue-300/60'
                        : 'bg-white/50 text-gray-400 hover:bg-white/70 hover:text-blue-500 ring-1 ring-white/40'
                    }`}
                    title={event.partner_event ? 'Remove partner event' : 'Mark as partner event'}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleToggleHighlight(event, e)}
                    className={`p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${
                      event.is_highlight
                        ? 'bg-yellow-400/90 text-yellow-900 hover:bg-yellow-500 shadow-md ring-1 ring-yellow-300/60'
                        : 'bg-white/50 text-gray-400 hover:bg-white/70 hover:text-yellow-500 ring-1 ring-white/40'
                    }`}
                    title={event.is_highlight ? 'Remove highlight' : 'Add highlight'}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-10">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {event.format && <Badge color="blue" size="sm">{formatFormatLabel(event.format)}</Badge>}
                        {event.partner_event && <Badge color="blue" size="sm">Partner</Badge>}
                        {event.is_highlight && <Badge color="yellow" size="sm">⭐ Highlight</Badge>}
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-white/40 pt-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatEventDateTime(event)}
                      </p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.link && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Link</p>
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Event
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {event.organisers && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Organisers</p>
                        <p className="text-sm font-medium text-gray-900">{event.organisers}</p>
                      </div>
                    </div>
                  )}

                  {(event.posted_linkedin || event.posted_whatsapp || event.posted_newsletter) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/40">
                      {event.posted_linkedin && (
                        <span className="text-xs text-gray-500">✓ LinkedIn</span>
                      )}
                      {event.posted_whatsapp && (
                        <span className="text-xs text-gray-500">✓ WhatsApp</span>
                      )}
                      {event.posted_newsletter && (
                        <span className="text-xs text-gray-500">✓ Newsletter</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="glass overflow-hidden rounded-3xl">
                  <table className="min-w-full divide-y divide-white/40">
                    <thead className="bg-white/30 backdrop-blur-sm">
                      <tr>
                        {tableColumns.map((column) => (
                          <th
                            key={column.key}
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            {column.label}
                          </th>
                        ))}
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      {sortedFilteredEvents.map((event) => (
                        <tr
                          key={event.id}
                          className={`transition-colors ${
                            event.is_highlight
                              ? 'bg-yellow-100/40 hover:bg-yellow-100/60 border-l-4 border-yellow-400'
                              : 'hover:bg-white/40'
                          }`}
                        >
                          {tableColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 ${
                                column.key === 'name' ? '' : 'whitespace-nowrap'
                              }`}
                            >
                              {column.render
                                ? column.render(event[column.key], event)
                                : event[column.key]?.toString() || '-'}
                            </td>
                          ))}
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => handleViewDetails(event)}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEdit(event)}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(event)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chronological View */
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300/60 via-white/40 to-primary-300/60"></div>

            <div className="space-y-8">
              {eventsByDate.map(({ date, events: dateEvents }) => (
                <div key={date.toISOString()} className="relative flex gap-6">
                  <div className="flex-shrink-0 w-16 text-right pt-1">
                    <div className="sticky top-4">
                      <div className="relative">
                        <div className="absolute -left-8 top-2 w-4 h-4 bg-white/80 backdrop-blur-sm border-2 border-primary-500 rounded-full shadow-md"></div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDateLabel(date)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDayOfWeek(date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 pb-8">
                    {dateEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleViewDetails(event)}
                        className={`group rounded-3xl backdrop-blur-xl border transition-all duration-200 overflow-hidden cursor-pointer hover:-translate-y-0.5 ${
                          event.is_highlight
                            ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl shadow-md shadow-yellow-200/30'
                            : 'glass hover:shadow-lg hover:bg-white/70'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {event.start_time && (
                                <div className="text-sm font-medium text-gray-900 mb-2">
                                  {event.start_time}
                                </div>
                              )}

                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {event.name}
                              </h3>

                              {event.organisers && (
                                <p className="text-sm text-gray-600 mb-3">
                                  By {event.organisers}
                                </p>
                              )}

                              {event.location && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {event.location}
                                </p>
                              )}

                              {event.description && (
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {event.description}
                                </p>
                              )}

                              {event.format && (
                                <div className="flex items-center gap-2 flex-wrap mt-3">
                                  <Badge color="blue" size="sm">{formatFormatLabel(event.format)}</Badge>
                                  {event.is_highlight && <Badge color="yellow" size="sm">⭐ Highlight</Badge>}
                                </div>
                              )}
                            </div>

                            <div className="flex-shrink-0 w-24 h-24 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/40">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail View Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setViewingEvent(null)
        }}
        title="Event Details"
      >
        {viewingEvent && (
          <EventDetailView
            event={viewingEvent}
            onEdit={() => {
              setIsDetailModalOpen(false)
              setEditingEvent(viewingEvent)
              setIsModalOpen(true)
            }}
            onDelete={() => {
              setIsDetailModalOpen(false)
              handleDelete(viewingEvent)
            }}
            onClose={() => {
              setIsDetailModalOpen(false)
              setViewingEvent(null)
            }}
          />
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEvent(null)
          setError('')
        }}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
      >
        <EventForm
          initialData={editingEvent}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingEvent(null)
            setError('')
          }}
          title={editingEvent ? 'Edit Event' : 'Add Event'}
        />
      </Modal>

      <ConfirmModal
        isOpen={linkedInConfirmOpen}
        title="Generate Events LinkedIn Draft"
        info="The next 4 highlighted events with the closest start dates will be included in the post."
        checklist={[
          'Have you highlighted the events you want featured in the post?',
        ]}
        previewItems={eventsLinkedInPreview}
        previewLabel="Events to be included"
        confirmLabel="Yes, generate draft"
        onConfirm={confirmLinkedInPost}
        onCancel={() => setLinkedInConfirmOpen(false)}
      />
    </Layout>
  )
}
