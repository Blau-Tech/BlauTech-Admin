'use client'

import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import OrganisationForm from '@/components/OrganisationForm'
import { organisationsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import GlassCard from '@/components/ui/GlassCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBanner from '@/components/ui/ErrorBanner'
import SuccessBanner from '@/components/ui/SuccessBanner'
import SearchBar from '@/components/ui/SearchBar'
import Badge, { BadgeColor } from '@/components/ui/Badge'

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

const typeBadgeColor = (type: OrganisationType): BadgeColor => {
  switch (type) {
    case 'VC': return 'purple'
    case 'UNIVERSITY': return 'blue'
    case 'STUDENT_CLUB': return 'green'
    case 'COMMUNITY': return 'pink'
    case 'INCUBATOR': return 'amber'
    case 'ACCELERATOR': return 'orange'
    default: return 'gray'
  }
}

export default function OrganisationsPage() {
  const { isAdmin, isCityLead, userCity, loading: authLoading } = useAuth()
  const cityFilter = isCityLead ? userCity ?? undefined : undefined
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<OrganisationType | 'ALL'>('ALL')

  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null)

  useEffect(() => {
    if (authLoading) return
    loadOrganisations()
  }, [authLoading, cityFilter])

  const loadOrganisations = async () => {
    try {
      setLoading(true)
      const data = await organisationsApi.fetch(cityFilter)
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

    if (selectedCity) {
      filtered = filtered.filter((o) => o.city === selectedCity)
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
  }, [organisations, searchQuery, typeFilter, selectedCity])

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
        <LoadingSpinner label="Loading organisations..." />
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
              className="block rounded-xl bg-primary-600/90 backdrop-blur-sm px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all"
            >
              Add Organisation
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setTypeFilter(tf.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border backdrop-blur-sm transition-all ${
                typeFilter === tf.value
                  ? 'bg-primary-100/80 border-primary-400/60 text-primary-800 shadow-sm'
                  : 'bg-white/40 border-white/50 text-gray-700 hover:bg-white/60'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
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
            {selectedCity && (
              <button
                type="button"
                onClick={() => setSelectedCity(null)}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        )}

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search organisations by name, description, tags, etc..."
          className="mb-6"
        />

        {filteredOrganisations.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-500">
              {organisations.length === 0 ? 'No organisations yet' : 'No organisations match your search criteria'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredOrganisations.map((org) => (
              <div
                key={org.id}
                className={`group relative rounded-3xl backdrop-blur-xl transition-all duration-300 overflow-hidden border hover:-translate-y-0.5 ${
                  org.is_highlight
                    ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl'
                    : 'glass hover:shadow-lg hover:bg-white/70'
                }`}
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{org.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge color={typeBadgeColor(org.type)} size="sm">{TYPE_LABELS[org.type]}</Badge>
                        <Badge color="gray" size="sm">{org.city}</Badge>
                        {org.is_highlight && <Badge color="yellow" size="sm">⭐ Highlight</Badge>}
                      </div>
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{org.description}</p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-white/40 pt-4">
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
                        <Badge key={tag} color="blue" size="sm">{tag}</Badge>
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

                  <div className="flex justify-end space-x-4 pt-2 border-t border-white/40">
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
