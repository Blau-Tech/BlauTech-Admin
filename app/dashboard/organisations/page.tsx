'use client'

import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import OrganisationForm from '@/components/OrganisationForm'
import { organisationsApi } from '@/lib/api'

type OrganisationType =
  | 'VC'
  | 'UNIVERSITY'
  | 'STUDENT_CLUB'
  | 'COMMUNITY'
  | 'INCUBATOR'
  | 'ACCELERATOR'

type Organisation = {
  id: string
  type: OrganisationType
  city: 'MUNICH' | 'BERLIN' | 'MADRID'
  name: string
  description: string
  website: string | null
  tags: string[] | null
  investment_stage: string | null
  investment_focus: string[] | null
  affiliated_universities: string[] | null
  is_highlight: boolean
  created_at: string
}

const TYPE_LABELS: Record<OrganisationType, string> = {
  VC: 'VC',
  UNIVERSITY: 'University',
  STUDENT_CLUB: 'Student Club',
  COMMUNITY: 'Community',
  INCUBATOR: 'Incubator',
  ACCELERATOR: 'Accelerator',
}

const TYPE_FILTERS: { value: OrganisationType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'STUDENT_CLUB', label: 'Student Clubs' },
  { value: 'UNIVERSITY', label: 'Universities' },
  { value: 'VC', label: 'VCs' },
  { value: 'COMMUNITY', label: 'Communities' },
  { value: 'INCUBATOR', label: 'Incubators' },
  { value: 'ACCELERATOR', label: 'Accelerators' },
]

const typeColor = (type: OrganisationType): string => {
  switch (type) {
    case 'VC': return 'bg-purple-100 text-purple-800'
    case 'UNIVERSITY': return 'bg-blue-100 text-blue-800'
    case 'STUDENT_CLUB': return 'bg-green-100 text-green-800'
    case 'COMMUNITY': return 'bg-pink-100 text-pink-800'
    case 'INCUBATOR': return 'bg-amber-100 text-amber-800'
    case 'ACCELERATOR': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function OrganisationsPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<OrganisationType | 'ALL'>('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null)

  useEffect(() => {
    loadOrganisations()
  }, [])

  const loadOrganisations = async () => {
    try {
      setLoading(true)
      const data = await organisationsApi.fetch()
      setOrganisations(data as Organisation[])
    } catch (err: any) {
      setError(err.message || 'Failed to load organisations')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganisations = useMemo(() => {
    let filtered = [...organisations]

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((o) => o.type === typeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((org) => {
        const name = (org.name || '').toLowerCase()
        const description = (org.description || '').toLowerCase()
        const website = (org.website || '').toLowerCase()
        const tags = (org.tags || []).join(', ').toLowerCase()
        const focus = (org.investment_focus || []).join(', ').toLowerCase()
        const unis = (org.affiliated_universities || []).join(', ').toLowerCase()
        return (
          name.includes(q) ||
          description.includes(q) ||
          website.includes(q) ||
          tags.includes(q) ||
          focus.includes(q) ||
          unis.includes(q)
        )
      })
    }

    return filtered
  }, [organisations, searchQuery, typeFilter])

  const handleAdd = () => {
    setEditingOrg(null)
    setIsModalOpen(true)
  }

  const handleEdit = (org: Organisation) => {
    setEditingOrg(org)
    setIsModalOpen(true)
  }

  const handleDelete = async (org: Organisation) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"?`)) return
    try {
      setError('')
      await organisationsApi.delete(org.id)
      await loadOrganisations()
      setSuccessMessage('Organisation deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete organisation')
    }
  }

  const handleSubmit = async (data: any) => {
    setError('')
    setSuccessMessage('')

    if (editingOrg) {
      await organisationsApi.update(editingOrg.id, data)
      setSuccessMessage('Organisation updated successfully!')
    } else {
      await organisationsApi.create(data)
      setSuccessMessage('Organisation created successfully!')
    }

    setTimeout(() => {
      setIsModalOpen(false)
      setEditingOrg(null)
      setSuccessMessage('')
      loadOrganisations()
    }, 800)
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
            {filteredOrganisations.length !== organisations.length && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredOrganisations.length} of {organisations.length} organisations
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="block rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Add Organisation
            </button>
          </div>
        </div>

        {/* Type filter pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setTypeFilter(tf.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                typeFilter === tf.value
                  ? 'bg-primary-100 border-primary-400 text-primary-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search organisations by name, description, tags, etc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {filteredOrganisations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">
              {organisations.length === 0 ? 'No organisations yet' : 'No organisations match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredOrganisations.map((org) => (
              <div
                key={org.id}
                className={`group relative rounded-xl shadow-sm border-2 transition-all duration-300 overflow-hidden ${
                  org.is_highlight
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 hover:border-yellow-500 hover:shadow-xl'
                    : 'bg-white border-gray-200 hover:shadow-lg hover:border-primary-300'
                }`}
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{org.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColor(org.type)}`}>
                          {TYPE_LABELS[org.type]}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {org.city}
                        </span>
                        {org.is_highlight && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Highlight</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{org.description}</p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-gray-100 pt-4">
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                    >
                      Visit website
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {Array.isArray(org.tags) && org.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {org.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{tag}</span>
                      ))}
                    </div>
                  )}

                  {org.type === 'VC' && (
                    <div className="space-y-1">
                      {org.investment_stage && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Stage:</span> {org.investment_stage}
                        </p>
                      )}
                      {Array.isArray(org.investment_focus) && org.investment_focus.length > 0 && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Focus:</span> {org.investment_focus.join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  {org.type === 'UNIVERSITY' && Array.isArray(org.affiliated_universities) && org.affiliated_universities.length > 0 && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Affiliated:</span> {org.affiliated_universities.join(', ')}
                    </p>
                  )}

                  <div className="flex justify-end space-x-4 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(org)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(org)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingOrg(null)
          setError('')
        }}
        title={editingOrg ? 'Edit Organisation' : 'Add Organisation'}
      >
        <OrganisationForm
          initialData={editingOrg}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingOrg(null)
            setError('')
          }}
          title={editingOrg ? 'Edit Organisation' : 'Add Organisation'}
        />
      </Modal>
    </Layout>
  )
}
