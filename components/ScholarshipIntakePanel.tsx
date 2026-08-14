'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { scholarshipsApi } from '@/lib/api'
import {
  buildReviewedScholarship,
  validateReviewedScholarship,
  type ScholarshipBenefit,
  type ScholarshipEligibility,
  type ScholarshipEvidence,
  type ScholarshipReviewPayload,
} from '@/lib/scholarshipIntake'
import Badge from '@/components/ui/Badge'
import ErrorBanner from '@/components/ui/ErrorBanner'
import GlassCard from '@/components/ui/GlassCard'
import SuccessBanner from '@/components/ui/SuccessBanner'
import {
  CheckboxField,
  SelectField,
  TextareaField,
  TextField,
} from '@/components/ui/FormField'

const EVIDENCE_FIELDS = [
  'title',
  'provider',
  'summary',
  'description',
  'applications_open',
  'application_opens_at',
  'deadline',
  'deadline_type',
  'provider_country',
  'application_process',
  'contact_email',
  'official_url',
  'application_url',
] as const

const FREQUENCIES = ['monthly', 'yearly', 'weekly', 'daily', 'one_time', 'per_semester']

type TaxonomyItem = { key: string; name: string; category?: string }

interface ScholarshipIntakePanelProps {
  onPublished: () => void | Promise<void>
}

function emptyEligibility(): ScholarshipEligibility {
  return { key: 'OTHER', required: true, details: null, source_quote: '' }
}

function emptyBenefit(): ScholarshipBenefit {
  return {
    key: 'OTHER',
    amount: null,
    currency: null,
    frequency: null,
    duration_months: null,
    details: null,
    source_quote: '',
  }
}

function emptyEvidence(sourceUrl: string): ScholarshipEvidence {
  return { field: 'title', quote: '', source_url: sourceUrl }
}

function nullable(value: string): string | null {
  const cleaned = value.trim()
  return cleaned || null
}

export default function ScholarshipIntakePanel({ onPublished }: ScholarshipIntakePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [draft, setDraft] = useState<ScholarshipReviewPayload | null>(null)
  const [eligibilityTypes, setEligibilityTypes] = useState<TaxonomyItem[]>([])
  const [benefitTypes, setBenefitTypes] = useState<TaxonomyItem[]>([])
  const [extracting, setExtracting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewAccepted, setPreviewAccepted] = useState<boolean | null>(null)
  const [previewReason, setPreviewReason] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    scholarshipsApi.fetchTaxonomy()
      .then(({ eligibilities, benefits }) => {
        setEligibilityTypes(eligibilities)
        setBenefitTypes(benefits)
      })
      .catch((err: Error) => setError(`Could not load scholarship taxonomy: ${err.message}`))
  }, [])

  const updateDraft = (updates: Partial<ScholarshipReviewPayload>) => {
    setDraft((current) => current ? { ...current, ...updates } : current)
  }

  const updateEligibility = (index: number, updates: Partial<ScholarshipEligibility>) => {
    setDraft((current) => {
      if (!current) return current
      const eligibilities = current.eligibilities.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...updates } : item
      ))
      return { ...current, eligibilities, eligibility_summary: nullable(eligibilities.map((item) => item.details).filter(Boolean).join('; ')) }
    })
  }

  const updateBenefit = (index: number, updates: Partial<ScholarshipBenefit>) => {
    setDraft((current) => current ? {
      ...current,
      benefits: current.benefits.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...updates } : item
      )),
    } : current)
  }

  const updateEvidence = (index: number, updates: Partial<ScholarshipEvidence>) => {
    setDraft((current) => current ? {
      ...current,
      source_evidence: {
        ...current.source_evidence,
        fields: current.source_evidence.fields.map((item, itemIndex) => (
          itemIndex === index ? { ...item, ...updates } : item
        )),
      },
    } : current)
  }

  const extractPreview = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const parsedUrl = new URL(url)
      if (parsedUrl.protocol !== 'https:') throw new Error('Enter a valid HTTPS scholarship URL.')
    } catch {
      setError('Enter a valid HTTPS scholarship URL.')
      return
    }

    try {
      setExtracting(true)
      const preview = await scholarshipsApi.preview(url.trim())
      if (!preview?.result) throw new Error('The extractor returned no scholarship preview.')

      setDraft(buildReviewedScholarship(preview.result))
      setPreviewAccepted(preview.result.accepted === true)
      setPreviewReason(preview.result.rejection_reason || null)
    } catch (err: any) {
      setDraft(null)
      setPreviewAccepted(null)
      setPreviewReason(null)
      setError(err.message || 'Scholarship extraction failed.')
    } finally {
      setExtracting(false)
    }
  }

  const publish = async () => {
    if (!draft) return
    setError('')
    setSuccess('')

    const reviewedDraft: ScholarshipReviewPayload = {
      ...draft,
      source_evidence: {
        ...draft.source_evidence,
        source_urls: Array.from(new Set([
          ...draft.source_evidence.source_urls,
          ...draft.source_evidence.fields.map((item) => item.source_url),
        ].filter(Boolean))),
      },
    }
    const validationError = validateReviewedScholarship(reviewedDraft)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setPublishing(true)
      const result = await scholarshipsApi.publishReviewed(reviewedDraft)

      if (result.status === 'DUPLICATE') {
        setSuccess('This official URL is already published. No duplicate was created.')
        return
      }

      setSuccess(result.reviewed_existing
        ? 'The existing draft was corrected and published.'
        : 'The reviewed scholarship was published.')
      await onPublished()
      setDraft(null)
      setUrl('')
      setPreviewAccepted(null)
      setPreviewReason(null)
    } catch (err: any) {
      setError(err.message || 'Failed to publish the reviewed scholarship.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <GlassCard className="mb-8 overflow-hidden">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Grounded scholarship intake</h2>
            <Badge color="purple" size="sm">Admin</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Extract a write-free preview, correct only what the source proves, then publish atomically.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="scholarship-intake-panel"
          onClick={() => setIsOpen((value) => !value)}
          className="self-start rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/60"
        >
          {isOpen ? 'Close intake' : 'Review a URL'}
        </button>
      </div>

      {isOpen && (
        <div id="scholarship-intake-panel" className="border-t border-white/50 px-5 py-6 sm:px-6">
          {error && <ErrorBanner message={error} onClose={() => setError('')} className="mb-4" />}
          {success && <SuccessBanner message={success} className="mb-4" />}

          <form onSubmit={extractPreview} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <TextField
                id="scholarship-intake-url"
                label="Scholarship page URL"
                type="url"
                inputMode="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://provider.example/scholarship"
              />
            </div>
            <button
              type="submit"
              disabled={extracting}
              className="shrink-0 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {extracting ? 'Extracting preview...' : 'Extract preview'}
            </button>
          </form>

          {draft && (
            <div className="mt-6 space-y-8">
              <div
                role="status"
                className={`border-l-4 px-4 py-3 text-sm ${
                  previewAccepted
                    ? 'border-green-500 bg-green-50/70 text-green-900'
                    : 'border-amber-500 bg-amber-50/70 text-amber-950'
                }`}
              >
                <p className="font-semibold">
                  {previewAccepted ? 'Extraction passed automated grounding.' : 'Extraction needs human correction.'}
                </p>
                {previewReason && <p className="mt-1">{previewReason}</p>}
                <p className="mt-1 text-xs opacity-80">Publishing still validates required evidence and exact source quotes.</p>
              </div>

              <section aria-labelledby="review-core-heading">
                <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/50 pb-2">
                  <div>
                    <h3 id="review-core-heading" className="font-semibold text-gray-900">Core record</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Edit extracted values only when an evidence quote below proves the correction.</p>
                  </div>
                  <a
                    href={draft.source_evidence.submitted_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-sm font-medium text-primary-700 hover:text-primary-900"
                  >
                    Open source
                  </a>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField id="review-title" label="Title" required value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} />
                  <TextField id="review-provider" label="Provider" required value={draft.provider_name} onChange={(event) => updateDraft({ provider_name: event.target.value })} />
                  <TextField id="review-provider-url" label="Provider URL" type="url" value={draft.provider_url || ''} onChange={(event) => updateDraft({ provider_url: nullable(event.target.value) })} />
                  <TextField id="review-provider-country" label="Provider country" value={draft.provider_country || ''} onChange={(event) => updateDraft({ provider_country: nullable(event.target.value) })} />
                  <TextField id="review-official-url" label="Official URL" type="url" required value={draft.official_url} onChange={(event) => updateDraft({ official_url: event.target.value })} />
                  <TextField id="review-application-url" label="Application URL" type="url" value={draft.application_url || ''} onChange={(event) => updateDraft({ application_url: nullable(event.target.value) })} />
                  <TextareaField id="review-summary" label="Summary" rows={3} value={draft.summary || ''} onChange={(event) => updateDraft({ summary: nullable(event.target.value) })} className="md:min-h-[6.25rem]" />
                  <TextareaField id="review-description" label="Description" required rows={3} value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} className="md:min-h-[6.25rem]" />
                  <CheckboxField id="review-applications-open" label="Official evidence confirms applications are open" checked={draft.applications_open} onChange={(event) => updateDraft({ applications_open: event.target.checked })} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <SelectField id="review-deadline-type" label="Deadline type" value={draft.deadline_type} onChange={(event) => updateDraft({ deadline_type: event.target.value as ScholarshipReviewPayload['deadline_type'] })}>
                    <option value="FIXED">Fixed</option>
                    <option value="ROLLING">Rolling</option>
                    <option value="OPEN_ENDED">Open-ended</option>
                    <option value="UNKNOWN">Unknown</option>
                  </SelectField>
                  <TextField id="review-application-opens" label="Application opens" type="date" value={draft.application_opens_at || ''} onChange={(event) => updateDraft({ application_opens_at: nullable(event.target.value) })} />
                  <TextField id="review-deadline" label="Deadline" type="date" value={draft.deadline || ''} onChange={(event) => updateDraft({ deadline: nullable(event.target.value) })} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextareaField id="review-application-process" label="Application process" rows={3} value={draft.application_process || ''} onChange={(event) => updateDraft({ application_process: nullable(event.target.value) })} />
                  <TextField id="review-contact-email" label="Contact email" type="email" value={draft.contact_email || ''} onChange={(event) => updateDraft({ contact_email: nullable(event.target.value) })} />
                </div>
              </section>

              <section aria-labelledby="review-eligibility-heading">
                <div className="mb-3 flex items-center justify-between border-b border-white/50 pb-2">
                  <div>
                    <h3 id="review-eligibility-heading" className="font-semibold text-gray-900">Eligibility</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Details must be copied from the exact quote.</p>
                  </div>
                  <button type="button" onClick={() => updateDraft({ eligibilities: [...draft.eligibilities, emptyEligibility()] })} className="text-sm font-semibold text-primary-700 hover:text-primary-900">
                    Add condition
                  </button>
                </div>
                <div className="space-y-4">
                  {draft.eligibilities.map((item, index) => (
                    <fieldset key={index} className="border-l-2 border-primary-200 pl-4">
                      <legend className="sr-only">Eligibility {index + 1}</legend>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField id={`eligibility-type-${index}`} label={`Condition ${index + 1}`} value={item.key} onChange={(event) => updateEligibility(index, { key: event.target.value })}>
                          {eligibilityTypes.map((type) => <option key={type.key} value={type.key}>{type.name}</option>)}
                          {!eligibilityTypes.some((type) => type.key === item.key) && <option value={item.key}>{item.key}</option>}
                        </SelectField>
                        <div className="flex items-end justify-between gap-4 pb-2">
                          <CheckboxField id={`eligibility-required-${index}`} label="Required condition" checked={item.required} onChange={(event) => updateEligibility(index, { required: event.target.checked })} />
                          <button type="button" disabled={draft.eligibilities.length === 1} onClick={() => updateDraft({ eligibilities: draft.eligibilities.filter((_, itemIndex) => itemIndex !== index) })} className="text-sm font-medium text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-40">
                            Remove
                          </button>
                        </div>
                        <TextField id={`eligibility-details-${index}`} label="Exact detail phrase" value={item.details || ''} onChange={(event) => updateEligibility(index, { details: nullable(event.target.value) })} />
                        <TextareaField id={`eligibility-quote-${index}`} label="Exact source quote" required rows={3} value={item.source_quote} onChange={(event) => updateEligibility(index, { source_quote: event.target.value })} />
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>

              <section aria-labelledby="review-benefit-heading">
                <div className="mb-3 flex items-center justify-between border-b border-white/50 pb-2">
                  <div>
                    <h3 id="review-benefit-heading" className="font-semibold text-gray-900">Benefits</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Keep unknown or qualified amounts empty and preserve qualifiers in the quote.</p>
                  </div>
                  <button type="button" onClick={() => updateDraft({ benefits: [...draft.benefits, emptyBenefit()] })} className="text-sm font-semibold text-primary-700 hover:text-primary-900">
                    Add benefit
                  </button>
                </div>
                {draft.benefits.length === 0 ? (
                  <p className="text-sm text-gray-500">No grounded benefits were extracted. Add one only if the source states it.</p>
                ) : (
                  <div className="space-y-4">
                    {draft.benefits.map((item, index) => (
                      <fieldset key={index} className="border-l-2 border-indigo-200 pl-4">
                        <legend className="sr-only">Benefit {index + 1}</legend>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <SelectField id={`benefit-type-${index}`} label={`Benefit ${index + 1}`} value={item.key} onChange={(event) => updateBenefit(index, { key: event.target.value })}>
                            {benefitTypes.map((type) => <option key={type.key} value={type.key}>{type.name}</option>)}
                            {!benefitTypes.some((type) => type.key === item.key) && <option value={item.key}>{item.key}</option>}
                          </SelectField>
                          <TextField id={`benefit-amount-${index}`} label="Exact amount" type="number" min="0" step="any" value={item.amount ?? ''} onChange={(event) => updateBenefit(index, { amount: event.target.value === '' ? null : Number(event.target.value) })} />
                          <TextField id={`benefit-currency-${index}`} label="Currency" maxLength={3} value={item.currency || ''} onChange={(event) => updateBenefit(index, { currency: nullable(event.target.value)?.toUpperCase() || null })} />
                          <SelectField id={`benefit-frequency-${index}`} label="Frequency" value={item.frequency || ''} onChange={(event) => updateBenefit(index, { frequency: nullable(event.target.value) })}>
                            <option value="">Not stated</option>
                            {FREQUENCIES.map((frequency) => <option key={frequency} value={frequency}>{frequency.replace('_', ' ')}</option>)}
                          </SelectField>
                          <TextField id={`benefit-duration-${index}`} label="Duration in months" type="number" min="1" step="1" value={item.duration_months ?? ''} onChange={(event) => updateBenefit(index, { duration_months: event.target.value === '' ? null : Number(event.target.value) })} />
                          <div className="flex items-end justify-end pb-2">
                            <button type="button" onClick={() => updateDraft({ benefits: draft.benefits.filter((_, itemIndex) => itemIndex !== index) })} className="text-sm font-medium text-red-700 hover:text-red-900">Remove</button>
                          </div>
                          <TextField id={`benefit-details-${index}`} label="Exact detail phrase" value={item.details || ''} onChange={(event) => updateBenefit(index, { details: nullable(event.target.value) })} />
                          <div className="md:col-span-2">
                            <TextareaField id={`benefit-quote-${index}`} label="Exact source quote" required rows={3} value={item.source_quote} onChange={(event) => updateBenefit(index, { source_quote: event.target.value })} />
                          </div>
                        </div>
                      </fieldset>
                    ))}
                  </div>
                )}
              </section>

              <section aria-labelledby="review-evidence-heading">
                <div className="mb-3 flex items-center justify-between border-b border-white/50 pb-2">
                  <div>
                    <h3 id="review-evidence-heading" className="font-semibold text-gray-900">Field evidence</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Title, provider, description, and official URL must exactly match their quotes.</p>
                  </div>
                  <button type="button" onClick={() => updateDraft({ source_evidence: { ...draft.source_evidence, fields: [...draft.source_evidence.fields, emptyEvidence(draft.source_evidence.submitted_url)] } })} className="text-sm font-semibold text-primary-700 hover:text-primary-900">
                    Add evidence
                  </button>
                </div>
                <div className="space-y-4">
                  {draft.source_evidence.fields.map((item, index) => (
                    <fieldset key={index} className="border-l-2 border-emerald-200 pl-4">
                      <legend className="sr-only">Evidence {index + 1}</legend>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <SelectField id={`evidence-field-${index}`} label={`Evidence ${index + 1}`} value={item.field} onChange={(event) => updateEvidence(index, { field: event.target.value })}>
                          {EVIDENCE_FIELDS.map((field) => <option key={field} value={field}>{field}</option>)}
                        </SelectField>
                        <div className="md:col-span-2">
                          <TextField id={`evidence-source-${index}`} label="Source URL" type="url" required value={item.source_url} onChange={(event) => updateEvidence(index, { source_url: event.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <TextareaField id={`evidence-quote-${index}`} label="Exact source quote" required rows={3} value={item.quote} onChange={(event) => updateEvidence(index, { quote: event.target.value })} />
                        </div>
                        <div className="flex items-end justify-end pb-2">
                          <button type="button" onClick={() => updateDraft({ source_evidence: { ...draft.source_evidence, fields: draft.source_evidence.fields.filter((_, itemIndex) => itemIndex !== index) } })} className="text-sm font-medium text-red-700 hover:text-red-900">Remove</button>
                        </div>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>

              <div className="flex flex-col items-start justify-between gap-4 border-t border-white/60 pt-5 sm:flex-row sm:items-center">
                <p className="max-w-2xl text-xs text-gray-500">
                  Publication is global. The database rejects missing evidence, ungrounded detail phrases, closed applications, and duplicate official URLs.
                </p>
                <button
                  type="button"
                  onClick={publish}
                  disabled={publishing}
                  className="shrink-0 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {publishing ? 'Publishing...' : 'Publish reviewed scholarship'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}
