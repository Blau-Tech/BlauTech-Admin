'use client'

import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import OpportunityForm from '@/components/OpportunityForm'
import { opportunitiesApi } from '@/lib/api'
import { format } from 'date-fns'

type OpportunityType = 'PROGRAM' | 'FELLOWSHIP'

type Opportunity = {
  id: string
  opportunity_type: OpportunityType
  cities: ('MUNICH' | 'BERLIN' | 'MADRID')[]
  title: string
  organisation: string
  description: string
  url: string
  deadline: string | null
  posted_linkedin: boolean
  posted_whatsapp: boolean
  posted_newsletter: boolean
  is_highlight: boolean
  created_at: string
}

const TYPE_LABELS: Record<OpportunityType, string> = {
  PROGRAM: 'Program',
  FELLOWSHIP: 'Fellowship',
}

const TYPE_FILTERS: { value: OpportunityType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PROGRAM', label: 'Programs' },
  { value: 'FELLOWSHIP', label: 'Fellowships' },
]

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'ALL'>('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)

  useEffect(() => {
    loadOpportunities()
  }, [])

  const loadOpportunities = async () => {
    try {
      setLoading(true)
      const data = await opportunitiesApi.fetch()
      setOpportunities(data as Opportunity[])
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities]

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((o) => o.opportunity_type === typeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((opp) => {
        const title = (opp.title || '').toLowerCase()
        const description = (opp.description || '').toLowerCase()
        const organisation = (opp.organisation || '').toLowerCase()
        return title.includes(q) || description.includes(q) || organisation.includes(q)
      })
    }

    return filtered
  }, [opportunities, searchQuery, typeFilter])

  const handleAdd = () => {
    setEditingOpp(null)
    setIsModalOpen(true)
  }

  const handleEdit = (opp: Opportunity) => {
    setEditingOpp(opp)
    setIsModalOpen(true)
  }

  const handleDelete = async (opp: Opportunity) => {
    if (!confirm(`Are you sure you want to delete "${opp.title}"?`)) return
    try {
      setError('')
      await opportunitiesApi.delete(opp.id)
      await loadOpportunities()
      setSuccessMessage('Opportunity deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete opportunity')
    }
  }

  const handleSubmit = async (data: any) => {
    setError('')
    setSuccessMessage('')

    if (editingOpp) {
      await opportunitiesApi.update(editingOpp.id, data)
      setSuccessMessage('Opportunity updated successfully!')
    } else {
      await opportunitiesApi.create(data)
      setSuccessMessage('Opportunity created successfully!')
    }

    setTimeout(() => {
      setIsModalOpen(false)
      setEditingOpp(null)
      setSuccessMessage('')
      loadOpportunities()
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
            <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
            {filteredOpportunities.length !== opportunities.length && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredOpportunities.length} of {opportunities.length} opportunities
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="block rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Add Opportunity
            </button>
          </div>
        </div>

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
            placeholder="Search opportunities by title, description, or organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">
              {opportunities.length === 0 ? 'No opportunities yet' : 'No opportunities match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className={`group relative rounded-xl shadow-sm border-2 transition-all duration-300 overflow-hidden ${
                  opp.is_highlight
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 hover:border-yellow-500 hover:shadow-xl'
                    : 'bg-white border-gray-200 hover:shadow-lg hover:border-primary-300'
                }`}
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{opp.title}</h3>
                      {opp.organisation && (
                        <p className="text-sm text-gray-500 mb-2">by {opp.organisation}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">
                          {TYPE_LABELS[opp.opportunity_type]}
                        </span>
                        {Array.isArray(opp.cities) && opp.cities.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{c}</span>
                        ))}
                        {opp.is_highlight && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Highlight</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {opp.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{opp.description}</p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-gray-100 pt-4">
                  {opp.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Deadline: {format(new Date(opp.deadline), 'PP')}</span>
                    </div>
                  )}

                  {opp.url && (
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {(opp.posted_linkedin || opp.posted_whatsapp || opp.posted_newsletter) && (
                    <div className="flex flex-wrap gap-2">
                      {opp.posted_linkedin && <span className="text-xs text-gray-500">✓ LinkedIn</span>}
                      {opp.posted_whatsapp && <span className="text-xs text-gray-500">✓ WhatsApp</span>}
                      {opp.posted_newsletter && <span className="text-xs text-gray-500">✓ Newsletter</span>}
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(opp)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(opp)}
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
          setEditingOpp(null)
          setError('')
        }}
        title={editingOpp ? 'Edit Opportunity' : 'Add Opportunity'}
      >
        <OpportunityForm
          initialData={editingOpp}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingOpp(null)
            setError('')
          }}
          title={editingOpp ? 'Edit Opportunity' : 'Add Opportunity'}
        />
      </Modal>
    </Layout>
  )
}
