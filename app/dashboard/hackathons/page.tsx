'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import HackathonForm from '@/components/HackathonForm'
import HackathonDetailView from '@/components/HackathonDetailView'
import { hackathonsApi, triggerWorkflow } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import GlassCard from '@/components/ui/GlassCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBanner from '@/components/ui/ErrorBanner'
import SuccessBanner from '@/components/ui/SuccessBanner'
import SearchBar from '@/components/ui/SearchBar'
import Badge from '@/components/ui/Badge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { format, isToday, isTomorrow, startOfDay } from 'date-fns'

type ViewMode = 'card' | 'table' | 'chronological'

export default function HackathonsPage() {
  const { isCityLead, userCity, loading: authLoading } = useAuth()
  const cityFilter = isCityLead ? userCity ?? undefined : undefined
  const [hackathons, setHackathons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingHackathon, setEditingHackathon] = useState<any>(null)
  const [viewingHackathon, setViewingHackathon] = useState<any>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (authLoading) return
    loadHackathons()
  }, [authLoading, cityFilter])

  const loadHackathons = async () => {
    try {
      setLoading(true)
      const data = await hackathonsApi.fetch(cityFilter)
      setHackathons(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingHackathon(null)
    setIsModalOpen(true)
  }

  const [linkedInConfirmOpen, setLinkedInConfirmOpen] = useState(false)

  const confirmLinkedInPost = async () => {
    // TODO: define the request URL and body payload
    await triggerWorkflow('TODO_LINKEDIN_POST_URL', {
      // TODO: populate with the required fields
    })
  }

  const handleEdit = (hackathon: any) => {
    setEditingHackathon(hackathon)
    setIsModalOpen(true)
  }

  const handleViewDetails = (hackathon: any) => {
    setViewingHackathon(hackathon)
    setIsDetailModalOpen(true)
  }

  const handleDelete = async (hackathon: any) => {
    if (!confirm(`Are you sure you want to delete "${hackathon.name || hackathon.title}"?`)) {
      return
    }

    try {
      await hackathonsApi.delete(hackathon.id)
      await loadHackathons()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleHighlight = async (hackathon: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening detail view
    try {
      await hackathonsApi.update(hackathon.id, { is_highlight: !hackathon.is_highlight })
      await loadHackathons()
    } catch (err: any) {
      setError(err.message || 'Failed to update highlight status')
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      setError('')
      setSuccessMessage('')
      
      if (editingHackathon) {
        await hackathonsApi.update(editingHackathon.id, data)
        setSuccessMessage('Hackathon updated successfully!')
      } else {
        await hackathonsApi.create(data)
        setSuccessMessage('Hackathon created successfully!')
      }
      
      // Close modal and reload after a short delay to show success message
      setTimeout(() => {
        setIsModalOpen(false)
        setEditingHackathon(null)
        setSuccessMessage('')
        loadHackathons()
      }, 1000)
    } catch (err: any) {
      console.error('Error saving hackathon:', err)
      // Error will be displayed in the form component
      throw err // Re-throw so form can handle it
    }
  }

  // Helper function to combine date and time
  const combineDateTime = (date: string | Date | null, time: string | null): Date | null => {
    if (!date) return null
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (time) {
      const [hours, minutes] = time.split(':')
      dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
    }
    return dateObj
  }

  // Helper function to format date and time
  const formatHackathonDateTime = (hackathon: any, isEnd: boolean = false) => {
    const date = isEnd ? hackathon.end_date : hackathon.start_date
    const time = isEnd ? hackathon.end_time : hackathon.start_time
    const dateTime = combineDateTime(date, time)
    if (!dateTime) return '-'
    return format(dateTime, 'PPp')
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

  // Filter hackathons based on search
  const filteredHackathons = useMemo(() => {
    let filtered = [...hackathons]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((hackathon) => {
        const name = (hackathon.name || hackathon.title || '').toLowerCase()
        const description = (hackathon.description || '').toLowerCase()
        const location = (hackathon.location || '').toLowerCase()
        const organisers = (hackathon.organisers || hackathon.organizer_name || '').toLowerCase()
        return (
          name.includes(query) ||
          description.includes(query) ||
          location.includes(query) ||
          organisers.includes(query)
        )
      })
    }

    return filtered
  }, [hackathons, searchQuery])

  // Group filtered hackathons by date for chronological view
  const hackathonsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    filteredHackathons.forEach((hackathon) => {
      if (hackathon.start_date) {
        const date = startOfDay(new Date(hackathon.start_date))
        const dateKey = date.toISOString()
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(hackathon)
      }
    })
    
    // Sort dates and hackathons within each date
    const sortedDates = Object.keys(grouped).sort()
    const result: Array<{ date: Date; hackathons: any[] }> = []
    sortedDates.forEach((dateKey) => {
      result.push({
        date: new Date(dateKey),
        hackathons: grouped[dateKey].sort((a, b) => {
          const dateTimeA = combineDateTime(a.start_date, a.start_time)
          const dateTimeB = combineDateTime(b.start_date, b.start_time)
          const timeA = dateTimeA ? dateTimeA.getTime() : 0
          const timeB = dateTimeB ? dateTimeB.getTime() : 0
          return timeA - timeB
        }),
      })
    })
    return result
  }, [filteredHackathons])

  // Table columns configuration
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
            {value || row.title || '-'}
          </div>
          {row.description && (
            <div className="text-sm text-gray-500 mt-1 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date & Time',
      render: (value: any, row: any) => formatHackathonDateTime(row, false),
    },
    {
      key: 'end_date',
      label: 'End Date & Time',
      render: (value: any, row: any) => formatHackathonDateTime(row, true),
    },
    {
      key: 'location',
      label: 'Location',
    },
    {
      key: 'organisers',
      label: 'Organisers',
      render: (value: any, row: any) => (
        <div>
          {value || row.organizer_name || '-'}
        </div>
      ),
    },
    {
      key: 'prizes',
      label: 'Prizes',
      render: (value: any) => value ? (
        <span className="text-sm text-gray-900 line-clamp-1">{value}</span>
      ) : '-',
    },
  ]

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading hackathons..." />
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
            <h1 className="text-2xl font-bold text-gray-900">Hackathons</h1>
            {filteredHackathons.length !== hackathons.length && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredHackathons.length} of {hackathons.length} hackathons
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center gap-3">
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
              Add Hackathon
            </button>
          </div>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search hackathons by title, description, location, or organizer..."
          className="mb-6"
        />

        {filteredHackathons.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-500">
              {hackathons.length === 0
                ? 'No hackathons available'
                : 'No hackathons match your search criteria'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Clear search
              </button>
            )}
          </GlassCard>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredHackathons.map((hackathon) => (
              <div
                key={hackathon.id}
                onClick={() => handleViewDetails(hackathon)}
                className={`group relative rounded-3xl backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer border hover:-translate-y-1 ${
                  hackathon.is_highlight
                    ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl shadow-yellow-200/30 shadow-lg'
                    : 'glass hover:shadow-xl hover:bg-white/70'
                }`}
              >
                <button
                  onClick={(e) => handleToggleHighlight(hackathon, e)}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    hackathon.is_highlight
                      ? 'bg-yellow-400/90 text-yellow-900 hover:bg-yellow-500 shadow-md ring-1 ring-yellow-300/60'
                      : 'bg-white/50 text-gray-400 hover:bg-white/70 hover:text-yellow-500 ring-1 ring-white/40'
                  }`}
                  title={hackathon.is_highlight ? 'Remove highlight' : 'Add highlight'}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>

                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-10">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {hackathon.name || hackathon.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {hackathon.is_highlight && <Badge color="yellow" size="sm">⭐ Highlight</Badge>}
                      </div>
                    </div>
                  </div>

                  {hackathon.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {hackathon.description}
                    </p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-white/40 pt-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Start Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatHackathonDateTime(hackathon, false)}
                      </p>
                      {hackathon.end_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ends: {formatHackathonDateTime(hackathon, true)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {hackathon.location && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900">{hackathon.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Prizes */}
                  {hackathon.prizes && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Prizes</p>
                        <p className="text-sm font-medium text-gray-900">{hackathon.prizes}</p>
                      </div>
                    </div>
                  )}

                  {/* Link */}
                  {hackathon.link && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Link</p>
                      <a
                        href={hackathon.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Hackathon
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {/* Organisers */}
                  {hackathon.organisers && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Organisers</p>
                        <p className="text-sm font-medium text-gray-900">{hackathon.organisers}</p>
                      </div>
                    </div>
                  )}

                  {/* Signup Deadline */}
                  {hackathon.signup_deadline && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Signup Deadline</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(hackathon.signup_deadline), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}

                  {(hackathon.posted_linkedin || hackathon.posted_whatsapp || hackathon.posted_newsletter) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/40">
                      {hackathon.posted_linkedin && (
                        <span className="text-xs text-gray-500">✓ LinkedIn</span>
                      )}
                      {hackathon.posted_whatsapp && (
                        <span className="text-xs text-gray-500">✓ WhatsApp</span>
                      )}
                      {hackathon.posted_newsletter && (
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
                      {filteredHackathons.map((hackathon) => (
                        <tr
                          key={hackathon.id}
                          className={`transition-colors ${
                            hackathon.is_highlight
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
                                ? column.render(hackathon[column.key], hackathon)
                                : hackathon[column.key]?.toString() || '-'}
                            </td>
                          ))}
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => handleViewDetails(hackathon)}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEdit(hackathon)}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(hackathon)}
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
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300/60 via-white/40 to-primary-300/60"></div>

            <div className="space-y-8">
              {hackathonsByDate.map(({ date, hackathons: dateHackathons }) => (
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
                    {dateHackathons.map((hackathon) => (
                      <div
                        key={hackathon.id}
                        onClick={() => handleViewDetails(hackathon)}
                        className={`group rounded-3xl backdrop-blur-xl border transition-all duration-200 overflow-hidden cursor-pointer hover:-translate-y-0.5 ${
                          hackathon.is_highlight
                            ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl shadow-md shadow-yellow-200/30'
                            : 'glass hover:shadow-lg hover:bg-white/70'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {hackathon.start_time && (
                                <div className="text-sm font-medium text-gray-900 mb-2">
                                  {hackathon.start_time}
                                </div>
                              )}

                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {hackathon.name || hackathon.title}
                                </h3>
                                {hackathon.is_highlight && <Badge color="yellow" size="sm">⭐ Highlight</Badge>}
                              </div>

                              {hackathon.organisers && (
                                <p className="text-sm text-gray-600 mb-3">
                                  By {hackathon.organisers}
                                </p>
                              )}

                              {hackathon.location && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {hackathon.location}
                                </p>
                              )}

                              {hackathon.prizes && (
                                <p className="text-sm text-gray-600 mb-3">
                                  Prizes: {hackathon.prizes}
                                </p>
                              )}

                              {hackathon.description && (
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {hackathon.description}
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0 w-24 h-24 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/40">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
          setViewingHackathon(null)
        }}
        title="Hackathon Details"
      >
        {viewingHackathon && (
          <HackathonDetailView
            hackathon={viewingHackathon}
            onEdit={() => {
              setIsDetailModalOpen(false)
              setEditingHackathon(viewingHackathon)
              setIsModalOpen(true)
            }}
            onDelete={() => {
              setIsDetailModalOpen(false)
              handleDelete(viewingHackathon)
            }}
            onClose={() => {
              setIsDetailModalOpen(false)
              setViewingHackathon(null)
            }}
          />
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingHackathon(null)
          setError('')
        }}
        title={editingHackathon ? 'Edit Hackathon' : 'Add Hackathon'}
      >
        <HackathonForm
          initialData={editingHackathon}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingHackathon(null)
            setError('')
          }}
          title={editingHackathon ? 'Edit Hackathon' : 'Add Hackathon'}
        />
      </Modal>

      <ConfirmModal
        isOpen={linkedInConfirmOpen}
        title="Generate Hackathons LinkedIn Draft"
        info="The next 3 highlighted hackathons with the closest start dates will be included in the post."
        checklist={[
          'Have you highlighted the hackathons you want featured in the post?',
        ]}
        confirmLabel="Yes, generate draft"
        onConfirm={confirmLinkedInPost}
        onCancel={() => setLinkedInConfirmOpen(false)}
      />
    </Layout>
  )
}
