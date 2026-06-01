'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import ScholarshipForm from '@/components/ScholarshipForm'
import { scholarshipsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import GlassCard from '@/components/ui/GlassCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBanner from '@/components/ui/ErrorBanner'
import SuccessBanner from '@/components/ui/SuccessBanner'
import SearchBar from '@/components/ui/SearchBar'
import Badge from '@/components/ui/Badge'
import { format, isToday, isTomorrow, startOfDay } from 'date-fns'

type ViewMode = 'card' | 'table' | 'chronological'

export default function ScholarshipsPage() {
  const { isCityLead, userCity, loading: authLoading } = useAuth()
  const cityFilter = isCityLead ? userCity ?? undefined : undefined
  const [scholarships, setScholarships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState<any>(null)
  const [viewingScholarship, setViewingScholarship] = useState<any>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [scholarshipLink, setScholarshipLink] = useState('')
  const [webhookUrl] = useState(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '')
  const [webhookLoading, setWebhookLoading] = useState(false)

  useEffect(() => {
    if (authLoading) return
    loadScholarships()
  }, [authLoading, cityFilter])

  const loadScholarships = async () => {
    try {
      setLoading(true)
      const data = await scholarshipsApi.fetch(cityFilter)
      setScholarships(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingScholarship(null)
    setIsModalOpen(true)
  }

  const handleEdit = (scholarship: any) => {
    setEditingScholarship(scholarship)
    setIsModalOpen(true)
  }

  const handleViewDetails = (scholarship: any) => {
    setViewingScholarship(scholarship)
    setIsDetailModalOpen(true)
  }

  const handleDelete = async (scholarship: any) => {
    if (!confirm(`Are you sure you want to delete "${scholarship.title}"?`)) {
      return
    }

    try {
      await scholarshipsApi.delete(scholarship.id)
      await loadScholarships()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      setError('')
      setSuccessMessage('')

      if (editingScholarship) {
        await scholarshipsApi.update(editingScholarship.id, data)
        setSuccessMessage('Scholarship updated successfully!')
      } else {
        await scholarshipsApi.create(data)
        setSuccessMessage('Scholarship created successfully!')
      }

      setTimeout(() => {
        setIsModalOpen(false)
        setEditingScholarship(null)
        setSuccessMessage('')
        loadScholarships()
      }, 1000)
    } catch (err: any) {
      console.error('Error saving scholarship:', err)
      throw err
    }
  }

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scholarshipLink.trim() || !webhookUrl) {
      return
    }

    try {
      setWebhookLoading(true)
      setError('')

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarship_link: scholarshipLink.trim() }),
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.statusText}`)
      }

      setSuccessMessage('Scholarship link sent successfully!')
      setScholarshipLink('')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to send webhook request')
    } finally {
      setWebhookLoading(false)
    }
  }

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const formatDayOfWeek = (date: Date) => format(date, 'EEEE')

  const filteredScholarships = useMemo(() => {
    let filtered = [...scholarships]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((s) => {
        const title = (s.title || '').toLowerCase()
        const description = (s.description || '').toLowerCase()
        const organisation = (s.organisation || '').toLowerCase()
        return title.includes(query) || description.includes(query) || organisation.includes(query)
      })
    }

    return filtered
  }, [scholarships, searchQuery])

  // Group by deadline date for chronological view
  const scholarshipsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    filteredScholarships.forEach((s) => {
      if (s.deadline) {
        const date = startOfDay(new Date(s.deadline))
        const key = date.toISOString()
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(s)
      }
    })

    const sortedDates = Object.keys(grouped).sort()
    return sortedDates.map((dateKey) => ({
      date: new Date(dateKey),
      scholarships: grouped[dateKey],
    }))
  }, [filteredScholarships])

  const tableColumns = [
    {
      key: 'title',
      label: 'Title',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {row.is_highlight && <span className="text-yellow-500" title="Highlighted">⭐</span>}
            {value || '-'}
          </div>
          {row.organisation && (
            <div className="text-sm text-gray-500 mt-0.5">{row.organisation}</div>
          )}
        </div>
      ),
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (value: any) => (value ? format(new Date(value), 'PP') : '-'),
    },
    {
      key: 'cities',
      label: 'Cities',
      render: (value: any) => (Array.isArray(value) && value.length > 0 ? value.join(', ') : '-'),
    },
    {
      key: 'study_level',
      label: 'Study Level',
      render: (value: any) => (Array.isArray(value) && value.length > 0 ? value.join(', ') : '-'),
    },
    {
      key: 'fields_of_study',
      label: 'Fields',
      render: (value: any) => (Array.isArray(value) && value.length > 0 ? value.join(', ') : '-'),
    },
  ]

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner label="Loading scholarships..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {error && <ErrorBanner message={error} onClose={() => setError('')} className="mb-4" />}
        {successMessage && <SuccessBanner message={successMessage} className="mb-4" />}

        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Scholarships</h1>
            {filteredScholarships.length !== scholarships.length && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredScholarships.length} of {scholarships.length} scholarships
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center gap-3">
            <div className="flex items-center gap-1 glass-subtle rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'card' ? 'bg-white/70 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/40'
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
                  viewMode === 'table' ? 'bg-white/70 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/40'
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
                  viewMode === 'chronological' ? 'bg-white/70 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/40'
                }`}
                title="Chronological View (by deadline)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="block rounded-xl bg-primary-600/90 backdrop-blur-sm px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all"
            >
              Add Scholarship
            </button>
          </div>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search scholarships by title, description, or organisation..."
          className="mb-6"
        />

        {/* n8n webhook input */}
        <div className="mb-8 flex justify-center">
          <GlassCard variant="subtle" className="w-full max-w-2xl p-4">
            <form onSubmit={handleWebhookSubmit} className="flex items-center gap-3">
              <input
                type="url"
                placeholder="Enter scholarship link URL..."
                value={scholarshipLink}
                onChange={(e) => setScholarshipLink(e.target.value)}
                className="flex-1 text-base px-4 py-3 glass-input rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500 transition-all"
                disabled={webhookLoading}
              />
              <button
                type="submit"
                disabled={!scholarshipLink.trim() || !webhookUrl || webhookLoading}
                className="px-6 py-3 text-base font-semibold text-white bg-primary-600/90 backdrop-blur-sm rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {webhookLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Display */}
        {filteredScholarships.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-500">
              {scholarships.length === 0 ? 'No scholarships available' : 'No scholarships match your search criteria'}
            </p>
          </GlassCard>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredScholarships.map((s) => (
              <div
                key={s.id}
                onClick={() => handleViewDetails(s)}
                className={`group relative rounded-3xl backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer border hover:-translate-y-1 ${
                  s.is_highlight
                    ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl shadow-yellow-200/30 shadow-lg'
                    : 'glass hover:shadow-xl hover:bg-white/70'
                }`}
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{s.title}</h3>
                      {s.organisation && (
                        <p className="text-sm text-gray-500 mb-2">by {s.organisation}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.is_highlight && <Badge color="yellow" size="sm">⭐ Highlight</Badge>}
                        {Array.isArray(s.cities) && s.cities.map((c: string) => (
                          <Badge key={c} color="gray" size="sm">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{s.description}</p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-white/40 pt-4">
                  {s.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Deadline: {format(new Date(s.deadline), 'PP')}</span>
                    </div>
                  )}

                  {Array.isArray(s.study_level) && s.study_level.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      </svg>
                      <span>{s.study_level.join(', ')}</span>
                    </div>
                  )}

                  {Array.isArray(s.fields_of_study) && s.fields_of_study.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.fields_of_study.map((f: string) => (
                        <Badge key={f} color="blue" size="sm">{f}</Badge>
                      ))}
                    </div>
                  )}

                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'table' ? (
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="glass overflow-hidden rounded-3xl">
                  <table className="min-w-full divide-y divide-white/40">
                    <thead className="bg-white/30 backdrop-blur-sm">
                      <tr>
                        {tableColumns.map((column) => (
                          <th key={column.key} scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            {column.label}
                          </th>
                        ))}
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      {filteredScholarships.map((s) => (
                        <tr key={s.id} className={`transition-colors ${s.is_highlight ? 'bg-yellow-100/40 hover:bg-yellow-100/60' : 'hover:bg-white/40'}`}>
                          {tableColumns.map((column) => (
                            <td key={column.key} className={`py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 ${column.key === 'title' ? '' : 'whitespace-nowrap'}`}>
                              {column.render ? column.render(s[column.key], s) : s[column.key]?.toString() || '-'}
                            </td>
                          ))}
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button onClick={() => handleViewDetails(s)} className="text-primary-600 hover:text-primary-800 font-medium">View</button>
                              <button onClick={() => handleEdit(s)} className="text-primary-600 hover:text-primary-800 font-medium">Edit</button>
                              <button onClick={() => handleDelete(s)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
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
          /* Chronological view — grouped by deadline */
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300/60 via-white/40 to-primary-300/60"></div>
            <div className="space-y-8">
              {scholarshipsByDate.map(({ date, scholarships: dateScholarships }) => (
                <div key={date.toISOString()} className="relative flex gap-6">
                  <div className="flex-shrink-0 w-16 text-right pt-1">
                    <div className="sticky top-4">
                      <div className="relative">
                        <div className="absolute -left-8 top-2 w-4 h-4 bg-white/80 backdrop-blur-sm border-2 border-primary-500 rounded-full shadow-md"></div>
                        <div className="text-sm font-semibold text-gray-900">{formatDateLabel(date)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDayOfWeek(date)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 pb-8">
                    {dateScholarships.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleViewDetails(s)}
                        className={`group rounded-3xl backdrop-blur-xl border transition-all duration-200 overflow-hidden cursor-pointer hover:-translate-y-0.5 ${
                          s.is_highlight
                            ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl shadow-md shadow-yellow-200/30'
                            : 'glass hover:shadow-lg hover:bg-white/70'
                        }`}
                      >
                        <div className="p-6">
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            Deadline: {format(new Date(s.deadline), 'PP')}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                          {s.organisation && <p className="text-sm text-gray-600 mb-3">By {s.organisation}</p>}
                          {s.description && <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>}
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
          setViewingScholarship(null)
        }}
        title="Scholarship Details"
      >
        {viewingScholarship && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{viewingScholarship.title}</h2>
              {viewingScholarship.organisation && (
                <p className="text-sm text-gray-500 mt-1">by {viewingScholarship.organisation}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {viewingScholarship.is_highlight && <Badge color="yellow" size="sm">⭐ Highlight</Badge>}
                {Array.isArray(viewingScholarship.cities) && viewingScholarship.cities.map((c: string) => (
                  <Badge key={c} color="gray" size="sm">{c}</Badge>
                ))}
              </div>
            </div>

            {viewingScholarship.description && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingScholarship.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {viewingScholarship.deadline && (
                <div>
                  <span className="font-medium text-gray-500">Deadline:</span>{' '}
                  <span className="text-gray-900">{format(new Date(viewingScholarship.deadline), 'PP')}</span>
                </div>
              )}
              {viewingScholarship.url && (
                <div>
                  <span className="font-medium text-gray-500">URL:</span>{' '}
                  <a href={viewingScholarship.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    Link
                  </a>
                </div>
              )}
              {Array.isArray(viewingScholarship.study_level) && viewingScholarship.study_level.length > 0 && (
                <div>
                  <span className="font-medium text-gray-500">Study Level:</span>{' '}
                  <span className="text-gray-900">{viewingScholarship.study_level.join(', ')}</span>
                </div>
              )}
              {Array.isArray(viewingScholarship.fields_of_study) && viewingScholarship.fields_of_study.length > 0 && (
                <div>
                  <span className="font-medium text-gray-500">Fields:</span>{' '}
                  <span className="text-gray-900">{viewingScholarship.fields_of_study.join(', ')}</span>
                </div>
              )}
            </div>

            {viewingScholarship.eligibility_notes && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Eligibility Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingScholarship.eligibility_notes}</p>
              </div>
            )}

            {(viewingScholarship.posted_linkedin || viewingScholarship.posted_whatsapp || viewingScholarship.posted_newsletter) && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Published On</h3>
                <div className="flex flex-wrap gap-2">
                  {viewingScholarship.posted_linkedin && <Badge color="blue" size="sm">LinkedIn</Badge>}
                  {viewingScholarship.posted_whatsapp && <Badge color="green" size="sm">WhatsApp</Badge>}
                  {viewingScholarship.posted_newsletter && <Badge color="purple" size="sm">Newsletter</Badge>}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/40">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setEditingScholarship(viewingScholarship)
                  setIsModalOpen(true)
                }}
                className="px-4 py-2 text-sm font-semibold text-primary-600 border border-primary-300/60 backdrop-blur-sm rounded-xl hover:bg-primary-50/60 transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  handleDelete(viewingScholarship)
                }}
                className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-300/60 backdrop-blur-sm rounded-xl hover:bg-red-50/60 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingScholarship(null)
          setError('')
        }}
        title={editingScholarship ? 'Edit Scholarship' : 'Add Scholarship'}
      >
        <ScholarshipForm
          initialData={editingScholarship}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingScholarship(null)
            setError('')
          }}
          title={editingScholarship ? 'Edit Scholarship' : 'Add Scholarship'}
        />
      </Modal>
    </Layout>
  )
}
