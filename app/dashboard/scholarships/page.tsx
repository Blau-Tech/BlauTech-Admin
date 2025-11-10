'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import EventForm from '@/components/EventForm'
import EventDetailView from '@/components/EventDetailView'
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
      
      // Close modal and reload after a short delay to show success message
      setTimeout(() => {
        setIsModalOpen(false)
        setEditingScholarship(null)
        setSuccessMessage('')
        loadScholarships()
      }, 1000)
    } catch (err: any) {
      console.error('Error saving scholarship:', err)
      // Error will be displayed in the form component
      throw err // Re-throw so form can handle it
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      postponed: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Postponed' },
      accepting_applications: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Accepting Applications' },
      reviewing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Reviewing' },
      awarded: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Awarded' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
    }
    const config = statusConfig[status] || statusConfig.draft
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      workshop: 'bg-purple-100 text-purple-800',
      conference: 'bg-indigo-100 text-indigo-800',
      meetup: 'bg-pink-100 text-pink-800',
      webinar: 'bg-cyan-100 text-cyan-800',
      networking: 'bg-orange-100 text-orange-800',
      training: 'bg-teal-100 text-teal-800',
      hackathon: 'bg-emerald-100 text-emerald-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
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

  // Filter scholarships based on search
  const filteredScholarships = useMemo(() => {
    let filtered = [...scholarships]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((scholarship) => {
        const title = (scholarship.title || '').toLowerCase()
        const description = (scholarship.short_description || scholarship.description || '').toLowerCase()
        const location = (scholarship.location || '').toLowerCase()
        const organizer = (scholarship.organizer_name || '').toLowerCase()
        return (
          title.includes(query) ||
          description.includes(query) ||
          location.includes(query) ||
          organizer.includes(query)
        )
      })
    }

    return filtered
  }, [scholarships, searchQuery])

  // Group filtered scholarships by date for chronological view
  const scholarshipsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    filteredScholarships.forEach((scholarship) => {
      if (scholarship.start_date) {
        const date = startOfDay(new Date(scholarship.start_date))
        const dateKey = date.toISOString()
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(scholarship)
      }
    })
    
    // Sort dates and scholarships within each date
    const sortedDates = Object.keys(grouped).sort()
    const result: Array<{ date: Date; scholarships: any[] }> = []
    sortedDates.forEach((dateKey) => {
      result.push({
        date: new Date(dateKey),
        scholarships: grouped[dateKey].sort((a, b) => {
          const timeA = a.start_date ? new Date(a.start_date).getTime() : 0
          const timeB = b.start_date ? new Date(b.start_date).getTime() : 0
          return timeA - timeB
        }),
      })
    })
    return result
  }, [filteredScholarships])

  // Table columns configuration
  const tableColumns = [
    {
      key: 'title',
      label: 'Title',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value || '-'}</div>
          {row.short_description && (
            <div className="text-sm text-gray-500 mt-1 line-clamp-1">{row.short_description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (value: any) => (value ? format(new Date(value), 'PPp') : '-'),
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (value: any) => (value ? format(new Date(value), 'PPp') : '-'),
    },
    {
      key: 'location',
      label: 'Location',
    },
    {
      key: 'organizer_name',
      label: 'Organizer',
      render: (value: any, row: any) => (
        <div>
          {value ? (
            <>
              <div className="font-medium text-gray-900">{value}</div>
              {row.organizer_contactinfo && (
                <div className="text-sm text-gray-500 mt-0.5">{row.organizer_contactinfo}</div>
              )}
            </>
          ) : (
            '-'
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any) => getStatusBadge(value),
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: any) =>
        value ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(value)}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        ) : (
          '-'
        ),
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
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError('')}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
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
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
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
            {/* View Toggle Buttons */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
                  viewMode === 'chronological'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
              onClick={handleAdd}
              className="block rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              Add Scholarship
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search scholarships by title, description, location, or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Scholarships Display - Conditional Rendering */}
        {filteredScholarships.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">
              {scholarships.length === 0
                ? 'No scholarships available'
                : 'No scholarships match your search criteria'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredScholarships.map((scholarship) => (
              <div
                key={scholarship.id}
                onClick={() => handleViewDetails(scholarship)}
                className="group relative bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Header with Status and Category */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {scholarship.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(scholarship.status)}
                        {scholarship.category && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(scholarship.category)}`}>
                            {scholarship.category.charAt(0).toUpperCase() + scholarship.category.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {scholarship.short_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {scholarship.short_description}
                    </p>
                  )}
                </div>

                {/* Details Section */}
                <div className="px-6 pb-4 space-y-3 border-t border-gray-100 pt-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Application Deadline</p>
                      <p className="text-sm font-medium text-gray-900">
                        {scholarship.end_date ? format(new Date(scholarship.end_date), 'PPp') : '-'}
                      </p>
                      {scholarship.start_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Opens: {format(new Date(scholarship.start_date), 'PPp')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Award Amount */}
                  {scholarship.award_amount && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Award Amount</p>
                        <p className="text-sm font-medium text-gray-900">
                          {scholarship.award_amount.toLocaleString()} {scholarship.award_currency || 'EUR'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Application URL */}
                  {scholarship.application_url && (
                    <div>
                      <a
                        href={scholarship.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Apply Now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {/* Organizer */}
                  {scholarship.organizer_name && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Provider</p>
                        <p className="text-sm font-medium text-gray-900">{scholarship.organizer_name}</p>
                        {scholarship.organizer_contactinfo && (
                          <p className="text-xs text-gray-500 mt-0.5">{scholarship.organizer_contactinfo}</p>
                        )}
                      </div>
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
                <div className="overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-xl bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
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
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredScholarships.map((scholarship) => (
                        <tr key={scholarship.id} className="hover:bg-gray-50 transition-colors">
                          {tableColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 ${
                                column.key === 'title' ? '' : 'whitespace-nowrap'
                              }`}
                            >
                              {column.render
                                ? column.render(scholarship[column.key], scholarship)
                                : scholarship[column.key]?.toString() || '-'}
                            </td>
                          ))}
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => handleViewDetails(scholarship)}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEdit(scholarship)}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(scholarship)}
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
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-8">
              {scholarshipsByDate.map(({ date, scholarships: dateScholarships }, dateIndex) => (
                <div key={date.toISOString()} className="relative flex gap-6">
                  {/* Date label on the left */}
                  <div className="flex-shrink-0 w-16 text-right pt-1">
                    <div className="sticky top-4">
                      <div className="relative">
                        <div className="absolute -left-8 top-2 w-4 h-4 bg-white border-2 border-primary-500 rounded-full"></div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDateLabel(date)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDayOfWeek(date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scholarships for this date */}
                  <div className="flex-1 space-y-4 pb-8">
                    {dateScholarships.map((scholarship) => (
                      <div
                        key={scholarship.id}
                        onClick={() => handleViewDetails(scholarship)}
                        className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden cursor-pointer"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Deadline */}
                              {scholarship.end_date && (
                                <div className="text-sm font-medium text-gray-900 mb-2">
                                  Deadline: {format(new Date(scholarship.end_date), 'HH:mm')}
                                </div>
                              )}
                              
                              {/* Title */}
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {scholarship.title}
                              </h3>
                              
                              {/* Award Amount */}
                              {scholarship.award_amount && (
                                <p className="text-sm font-semibold text-primary-600 mb-3">
                                  {scholarship.award_amount.toLocaleString()} {scholarship.award_currency || 'EUR'}
                                </p>
                              )}
                              
                              {/* Provider */}
                              {scholarship.organizer_name && (
                                <p className="text-sm text-gray-600 mb-3">
                                  By {scholarship.organizer_name}
                                  {scholarship.organizer_contactinfo && `, ${scholarship.organizer_contactinfo}`}
                                </p>
                              )}
                              
                              {/* Description */}
                              {scholarship.short_description && (
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {scholarship.short_description}
                                </p>
                              )}
                              
                              {/* Badges */}
                              <div className="flex items-center gap-2 flex-wrap mt-3">
                                {getStatusBadge(scholarship.status)}
                                {scholarship.category && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(scholarship.category)}`}>
                                    {scholarship.category.charAt(0).toUpperCase() + scholarship.category.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Scholarship image/logo placeholder */}
                            <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                              {scholarship.image_url ? (
                                <img
                                  src={scholarship.image_url}
                                  alt={scholarship.title}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M12 5v9" />
                                </svg>
                              )}
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
          setViewingScholarship(null)
        }}
        title="Scholarship Details"
      >
        {viewingScholarship && (
          <EventDetailView
            event={viewingScholarship}
            onEdit={() => {
              setIsDetailModalOpen(false)
              setEditingScholarship(viewingScholarship)
              setIsModalOpen(true)
            }}
            onDelete={() => {
              setIsDetailModalOpen(false)
              handleDelete(viewingScholarship)
            }}
            onClose={() => {
              setIsDetailModalOpen(false)
              setViewingScholarship(null)
            }}
          />
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
        <EventForm
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
