'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import ScholarshipForm from '@/components/ScholarshipForm'
import { scholarshipsApi } from '@/lib/api'
import { format, isToday, isTomorrow, startOfDay } from 'date-fns'

type ViewMode = 'card' | 'table' | 'chronological'

export default function ScholarshipsPage() {
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
    loadScholarships()
  }, [])

  const loadScholarships = async () => {
    try {
      setLoading(true)
      const data = await scholarshipsApi.fetch()
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
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
              </div>
              <div className="ml-auto pl-3">
                <button onClick={() => setError('')} className="inline-flex text-red-400 hover:text-red-600">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}

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
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'chronological' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
              className="block rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Add Scholarship
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search scholarships by title, description, or organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* n8n webhook input */}
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-2xl">
            <form onSubmit={handleWebhookSubmit} className="flex items-center gap-3">
              <input
                type="url"
                placeholder="Enter scholarship link URL..."
                value={scholarshipLink}
                onChange={(e) => setScholarshipLink(e.target.value)}
                className="flex-1 text-base px-4 py-3 border-2 border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                disabled={webhookLoading}
              />
              <button
                type="submit"
                disabled={!scholarshipLink.trim() || !webhookUrl || webhookLoading}
                className="px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {webhookLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* Display */}
        {filteredScholarships.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">
              {scholarships.length === 0 ? 'No scholarships available' : 'No scholarships match your search criteria'}
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredScholarships.map((s) => (
              <div
                key={s.id}
                onClick={() => handleViewDetails(s)}
                className={`group relative rounded-xl shadow-sm border-2 transition-all duration-300 overflow-hidden cursor-pointer ${
                  s.is_highlight
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 hover:border-yellow-500 hover:shadow-xl ring-2 ring-yellow-200 ring-opacity-50'
                    : 'bg-white border-gray-200 hover:shadow-lg hover:border-primary-300'
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
                        {s.is_highlight && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Highlight</span>
                        )}
                        {Array.isArray(s.cities) && s.cities.map((c: string) => (
                          <span key={c} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{s.description}</p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-gray-100 pt-4">
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
                        <span key={f} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{f}</span>
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
                <div className="overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-xl bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
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
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredScholarships.map((s) => (
                        <tr key={s.id} className={`transition-colors ${s.is_highlight ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}`}>
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
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-8">
              {scholarshipsByDate.map(({ date, scholarships: dateScholarships }) => (
                <div key={date.toISOString()} className="relative flex gap-6">
                  <div className="flex-shrink-0 w-16 text-right pt-1">
                    <div className="sticky top-4">
                      <div className="relative">
                        <div className="absolute -left-8 top-2 w-4 h-4 bg-white border-2 border-primary-500 rounded-full"></div>
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
                        className={`group rounded-xl shadow-sm border transition-all duration-200 overflow-hidden cursor-pointer ${
                          s.is_highlight
                            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 hover:border-yellow-500 hover:shadow-lg ring-2 ring-yellow-200 ring-opacity-50'
                            : 'bg-white border-gray-200 hover:shadow-md hover:border-primary-300'
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
                {viewingScholarship.is_highlight && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Highlight</span>
                )}
                {Array.isArray(viewingScholarship.cities) && viewingScholarship.cities.map((c: string) => (
                  <span key={c} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{c}</span>
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
                  {viewingScholarship.posted_linkedin && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">LinkedIn</span>
                  )}
                  {viewingScholarship.posted_whatsapp && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">WhatsApp</span>
                  )}
                  {viewingScholarship.posted_newsletter && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">Newsletter</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setEditingScholarship(viewingScholarship)
                  setIsModalOpen(true)
                }}
                className="px-4 py-2 text-sm font-semibold text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  handleDelete(viewingScholarship)
                }}
                className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
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
