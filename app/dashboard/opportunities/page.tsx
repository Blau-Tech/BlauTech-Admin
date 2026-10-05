'use client'

import ProgramSources from '@/components/ProgramSources'
import ProgramBacklogStatus from '@/components/ProgramBacklogStatus'
import ProgramBrowserApprovals from '@/components/ProgramBrowserApprovals'
import ProgramEvidenceHolds from '@/components/ProgramEvidenceHolds'
import ProgramReadingFailures from '@/components/ProgramReadingFailures'

import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import OpportunityForm from '@/components/OpportunityForm'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import { opportunitiesApi } from '@/lib/api'
import { programReviewsApi, reviewTimingLabel, reviewOutsideFocus, type ProgramReview, type ReviewDecision } from '@/lib/programReviews'
import { useAuth } from '@/lib/auth'
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
  is_published: boolean
  program_subtype?: string | null
  application_status?: string
  created_at: string
}

const TYPE_LABELS: Record<OpportunityType, string> = {
  PROGRAM: 'Program',
  FELLOWSHIP: 'Program',
}

const TYPE_FILTERS: { value: OpportunityType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PROGRAM', label: 'Programs' },
]

export default function OpportunitiesPage() {
  const { isAdmin, isCityLead, userCity, loading: authLoading } = useAuth()
  const cityFilter = isCityLead ? userCity ?? undefined : undefined
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'ALL'>('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)
  const [editingReview, setEditingReview] = useState<ProgramReview | null>(null)
  const [reviews, setReviews] = useState<ProgramReview[]>([])
  const [showOutsideFocus, setShowOutsideFocus] = useState(false)
  const outsideFocusCount = reviews.filter(review => reviewOutsideFocus(review.proposed_listing)).length
  const visibleReviews = showOutsideFocus ? reviews : reviews.filter(review => !reviewOutsideFocus(review.proposed_listing))
  const [reviewStatus, setReviewStatus] = useState<ProgramReview['status']>('PENDING')

  useEffect(() => {
    if (authLoading) return
    loadOpportunities()
  }, [authLoading, cityFilter, isAdmin, reviewStatus])

  const loadOpportunities = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await opportunitiesApi.fetch(cityFilter)
      setOpportunities(data as Opportunity[])
      setReviews(isAdmin ? await programReviewsApi.fetch(reviewStatus) : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities]

    if (typeFilter === 'PROGRAM') {
      filtered = filtered.filter((o) => ['PROGRAM', 'FELLOWSHIP'].includes(o.opportunity_type))
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
    setEditingReview(null)
    setIsModalOpen(true)
  }

  const handleEdit = (opp: Opportunity) => {
    setEditingOpp(opp)
    setEditingReview(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: any, decision: ReviewDecision = { action: 'SAVE' }) => {
    setError('')
    setSuccessMessage('')

    if (editingReview) {
      await programReviewsApi.decide(editingReview, data, decision)
      setSuccessMessage(decision.action === 'APPROVE' ? 'Reviewed version approved.' : decision.action === 'REJECT' ? 'Proposal rejected.' : 'Draft saved.')
    } else {
      const result = await programReviewsApi.submit(data, editingOpp?.id || null)
      setSuccessMessage(result?.status === 'REJECTED'
        ? 'This application round was already rejected. See the rejected reviews.'
        : result?.status === 'DUPLICATE' ? 'This proposal is already recorded.' : 'Draft saved for admin review.')
    }
    setIsModalOpen(false)
    setEditingOpp(null)
    setEditingReview(null)
    await loadOpportunities()
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
            {isAdmin && <button
              type="button"
              onClick={handleAdd}
              className="block rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Add program draft
            </button>}
          </div>
        </div>

        {isAdmin && <><ProgramBrowserApprovals /><ProgramEvidenceHolds /><ProgramReadingFailures /></>}

        {isAdmin && (
          <section aria-labelledby="program-reviews-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
            <h2 id="program-reviews-heading" className="text-lg font-semibold text-gray-900">Program reviews</h2>
            <p className="mt-1 text-sm text-gray-600">For individual tech builders; no existing company required. Drafts stay private until approved.</p>
            <div className="my-4 flex flex-wrap gap-2" aria-label="Review status">
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
                <button key={status} type="button" aria-pressed={reviewStatus === status} onClick={() => setReviewStatus(status)}
                  className={`rounded-lg border px-3 py-2 text-sm ${reviewStatus === status ? 'bg-primary-100 border-primary-400' : 'border-gray-300'}`}>
                  {status === 'PENDING' ? 'Pending' : status === 'APPROVED' ? 'Approved' : 'Rejected'}
                </button>
              ))}
              <button type="button" onClick={loadOpportunities} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">Refresh reviews</button>
            </div>
            {outsideFocusCount > 0 && <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showOutsideFocus} onChange={event => setShowOutsideFocus(event.target.checked)} />
              Show {outsideFocusCount} outside-focus reviews
            </label>}
            {!visibleReviews.length && <p className="text-sm text-gray-500">No {reviewStatus.toLowerCase()} reviews.</p>}
            <ul className="divide-y divide-gray-200">
              {visibleReviews.map(review => { const timing = reviewTimingLabel(review.proposed_listing); return (
                <li key={review.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{review.proposed_listing.title || 'Untitled program'}</h3>
                    <p className="text-sm text-gray-600">{review.proposed_listing.organisation} · {review.proposed_listing.program_subtype || 'Category needs review'}</p>
                    <p className="text-sm text-gray-500">{review.opportunity_id ? 'Existing listing · proposed update' : 'New listing'} · Recorded applications: {review.proposed_listing.application_status || 'UNKNOWN'}</p>
                    {timing && <div className="mt-2"><Badge color="amber" size="sm">{timing}</Badge><p className="mt-1 text-xs text-gray-500">Based on saved dates (UTC). Check the source for a newer intake.</p></div>}
                    {review.proposed_listing.deadline && <p className="text-sm text-gray-500">Deadline: {review.proposed_listing.deadline}</p>}
                    {review.rejection_reason && <p className="mt-1 text-sm text-red-700">Reason: {review.rejection_reason}</p>}
                    {review.reviewed_at && <p className="text-xs text-gray-500">Reviewed {new Date(review.reviewed_at).toLocaleString()}{review.reviewed_by ? ` · Admin ${review.reviewed_by}` : ''}</p>}
                    {review.source_url.startsWith('https://') && <a href={review.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-700 underline">Official source</a>}
                  </div>
                  {review.status === 'PENDING' && <button type="button" className="rounded-lg border border-primary-300 px-4 py-2 text-sm text-primary-700"
                    onClick={() => { setEditingOpp(null); setEditingReview(review); setIsModalOpen(true) }}>Review proposal</button>}
                </li>
              )})}
            </ul>
          </section>
        )}

        {isAdmin && <ProgramSources />}

        {isAdmin && <details className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <summary className="cursor-pointer text-lg font-semibold text-gray-900">Queue statistics &amp; sources</summary>
          <div className="mt-4"><ProgramBacklogStatus /></div>
        </details>}

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
          <GlassCard className="text-center py-12">
            <p className="text-gray-500">
              {opportunities.length === 0 ? 'No opportunities yet' : 'No opportunities match your search criteria'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((opp) => (
              <GlassCard
                key={opp.id}
                className={`group relative transition-all duration-300 overflow-hidden border hover:-translate-y-1 ${
                  opp.is_highlight
                    ? 'bg-gradient-to-br from-yellow-100/60 to-amber-100/60 border-yellow-300/70 hover:border-yellow-400 hover:shadow-xl shadow-yellow-200/30 shadow-lg'
                    : 'hover:shadow-xl hover:bg-white/70'
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
                        <Badge color="pink" size="sm">{opp.program_subtype === 'FELLOWSHIP' ? 'Fellowship' : opp.program_subtype === 'RESIDENCY' ? 'Residency' : opp.program_subtype === 'COMMUNITY' ? 'Builder community' : TYPE_LABELS[opp.opportunity_type]}</Badge>
                        {opp.application_status === 'CLOSED' ? <Badge color="gray" size="sm">Closed</Badge> : opp.is_published === false && <Badge color="amber" size="sm">Needs approval</Badge>}
                        {Array.isArray(opp.cities) && opp.cities.map((c) => (
                          <Badge key={c} color="gray" size="sm">{c}</Badge>
                        ))}
                        {opp.is_highlight && (
                          <Badge color="yellow" size="sm">⭐ Highlight</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {opp.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{opp.description}</p>
                  )}
                </div>

                <div className="px-6 pb-4 space-y-3 border-t border-white/40 pt-4">
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

                  {isAdmin && <div className="flex justify-end space-x-4 pt-2 border-t border-white/40">
                    <button
                      onClick={() => handleEdit(opp)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Propose changes
                    </button>
                  </div>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingOpp(null)
          setEditingReview(null)
          setError('')
        }}
        title={editingReview ? 'Review program' : editingOpp ? 'Propose program changes' : 'Add program draft'}
      >
        <OpportunityForm
          initialData={editingReview?.proposed_listing || editingOpp}
          review={editingReview}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingOpp(null)
            setEditingReview(null)
            setError('')
          }}
          title={editingOpp ? 'Edit Opportunity' : 'Add Opportunity'}
        />
      </Modal>
    </Layout>
  )
}
