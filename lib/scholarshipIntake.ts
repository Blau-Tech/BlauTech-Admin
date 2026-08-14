export type ScholarshipDeadlineType = 'FIXED' | 'ROLLING' | 'OPEN_ENDED' | 'UNKNOWN'

export interface ScholarshipEvidence {
  field: string
  quote: string
  source_url: string
}

export interface ScholarshipEligibility {
  key: string
  required: boolean
  details: string | null
  source_quote: string
}

export interface ScholarshipBenefit {
  key: string
  amount: number | null
  currency: string | null
  frequency: string | null
  duration_months: number | null
  details: string | null
  source_quote: string
}

export interface ScholarshipReviewPayload {
  title: string
  provider_name: string
  provider_url: string | null
  provider_country: string | null
  summary: string | null
  description: string
  official_url: string
  application_url: string | null
  applications_open: boolean
  application_opens_at: string | null
  deadline: string | null
  deadline_type: ScholarshipDeadlineType
  application_process: string | null
  contact_email: string | null
  eligibility_summary: string | null
  eligibilities: ScholarshipEligibility[]
  benefits: ScholarshipBenefit[]
  source_evidence: {
    submitted_url: string
    source_urls: string[]
    fields: ScholarshipEvidence[]
  }
}

export interface ScholarshipPreviewResult {
  accepted: boolean
  rejection_reason?: string | null
  canonical_url?: string | null
  queued_url?: string | null
  source_urls?: string[]
  provider?: {
    name?: string | null
    website_url?: string | null
    country?: string | null
  } | null
  scholarship?: {
    title?: string | null
    summary?: string | null
    description?: string | null
    official_url?: string | null
    application_url?: string | null
    applications_open?: boolean | null
    application_opens_at?: string | null
    deadline?: string | null
    deadline_type?: ScholarshipDeadlineType | null
    application_process?: string | null
    contact_email?: string | null
  } | null
  eligibilities?: ScholarshipEligibility[]
  benefits?: ScholarshipBenefit[]
  evidence?: ScholarshipEvidence[]
}

export interface ScholarshipPreviewResponse {
  ok: boolean
  test_mode: true
  action: 'preview_only'
  result: ScholarshipPreviewResult
}

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned || null
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function isHttpsUrl(value: string | null): boolean {
  if (!value) return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
  } catch {
    return false
  }
}

export function buildReviewedScholarship(result: ScholarshipPreviewResult): ScholarshipReviewPayload {
  const scholarship = result.scholarship || {}
  const provider = result.provider || {}
  const officialUrl = nullableText(scholarship.official_url) || nullableText(result.canonical_url) || ''
  const submittedUrl = nullableText(result.queued_url) || nullableText(result.canonical_url) || officialUrl
  const sourceUrls = Array.from(new Set([
    ...(Array.isArray(result.source_urls) ? result.source_urls : []),
    ...((result.evidence || []).map((item) => item.source_url)),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)))

  const eligibilities = Array.isArray(result.eligibilities)
    ? result.eligibilities.map((item) => ({
        key: nullableText(item.key) || 'OTHER',
        required: item.required !== false,
        details: nullableText(item.details),
        source_quote: nullableText(item.source_quote) || '',
      }))
    : []

  const benefits = Array.isArray(result.benefits)
    ? result.benefits.map((item) => ({
        key: nullableText(item.key) || 'OTHER',
        amount: typeof item.amount === 'number' ? item.amount : null,
        currency: nullableText(item.currency)?.toUpperCase() || null,
        frequency: nullableText(item.frequency),
        duration_months: typeof item.duration_months === 'number' ? item.duration_months : null,
        details: nullableText(item.details),
        source_quote: nullableText(item.source_quote) || '',
      }))
    : []

  return {
    title: nullableText(scholarship.title) || '',
    provider_name: nullableText(provider.name) || '',
    provider_url: nullableText(provider.website_url),
    provider_country: nullableText(provider.country),
    summary: nullableText(scholarship.summary),
    description: nullableText(scholarship.description) || '',
    official_url: officialUrl,
    application_url: nullableText(scholarship.application_url),
    applications_open: scholarship.applications_open === true,
    application_opens_at: nullableText(scholarship.application_opens_at),
    deadline: nullableText(scholarship.deadline),
    deadline_type: scholarship.deadline_type || 'UNKNOWN',
    application_process: nullableText(scholarship.application_process),
    contact_email: nullableText(scholarship.contact_email),
    eligibility_summary: nullableText(eligibilities.map((item) => item.details).filter(Boolean).join('; ')),
    eligibilities,
    benefits,
    source_evidence: {
      submitted_url: submittedUrl,
      source_urls: sourceUrls,
      fields: Array.isArray(result.evidence)
        ? result.evidence.map((item) => ({
            field: nullableText(item.field) || '',
            quote: nullableText(item.quote) || '',
            source_url: nullableText(item.source_url) || '',
          }))
        : [],
    },
  }
}

function evidenceFor(payload: ScholarshipReviewPayload, field: string): ScholarshipEvidence | undefined {
  return payload.source_evidence.fields.find((item) => item.field === field)
}

export function validateReviewedScholarship(payload: ScholarshipReviewPayload): string | null {
  if (!payload.title.trim()) return 'Title is required.'
  if (!payload.provider_name.trim()) return 'Provider is required.'
  if (!payload.description.trim()) return 'Description is required.'
  if (!isHttpsUrl(payload.official_url)) return 'Official URL must be a valid HTTPS URL.'
  if (payload.provider_url && !isHttpsUrl(payload.provider_url)) return 'Provider URL must be a valid HTTPS URL.'
  if (payload.application_url && !isHttpsUrl(payload.application_url)) return 'Application URL must be a valid HTTPS URL.'
  if (!payload.applications_open) return 'Applications must be verified as open before publication.'
  if (payload.deadline_type === 'FIXED' && !payload.deadline) return 'A fixed deadline requires a date.'
  if (payload.deadline_type === 'OPEN_ENDED' && payload.deadline) return 'Open-ended applications cannot have a fixed deadline.'
  if (payload.eligibilities.length === 0) return 'At least one grounded eligibility condition is required.'
  if (payload.benefits.length === 0) return 'At least one grounded scholarship benefit is required.'

  for (let index = 0; index < payload.eligibilities.length; index += 1) {
    const item = payload.eligibilities[index]
    if (!item.key.trim()) return `Eligibility ${index + 1} needs a type.`
    if (!item.source_quote.trim()) return `Eligibility ${index + 1} needs an exact source quote.`
    if (item.details && !normalizeText(item.source_quote).includes(normalizeText(item.details))) {
      return `Eligibility ${index + 1} details must be an exact phrase inside its source quote.`
    }
  }

  for (let index = 0; index < payload.benefits.length; index += 1) {
    const item = payload.benefits[index]
    if (!item.key.trim()) return `Benefit ${index + 1} needs a type.`
    if (!item.source_quote.trim()) return `Benefit ${index + 1} needs an exact source quote.`
    if (item.details && !normalizeText(item.source_quote).includes(normalizeText(item.details))) {
      return `Benefit ${index + 1} details must be an exact phrase inside its source quote.`
    }
  }

  for (let index = 0; index < payload.source_evidence.fields.length; index += 1) {
    const item = payload.source_evidence.fields[index]
    if (!item.field.trim() || !item.quote.trim() || !isHttpsUrl(item.source_url)) {
      return `Evidence ${index + 1} needs a field, exact quote, and HTTPS source URL.`
    }
  }

  const exactEvidence: Array<[string, string | null]> = [
    ['title', payload.title],
    ['provider', payload.provider_name],
    ['description', payload.description],
    ['official_url', payload.official_url],
    ['summary', payload.summary],
  ]

  for (const [field, value] of exactEvidence) {
    if (!value) continue
    const evidence = evidenceFor(payload, field)
    if (!evidence) return `${field} requires source evidence.`
    if (normalizeText(evidence.quote) !== normalizeText(value)) {
      return `${field} must exactly match its source quote.`
    }
  }

  if (!evidenceFor(payload, 'applications_open')) return 'applications_open requires source evidence.'
  if (payload.application_url && !evidenceFor(payload, 'application_url')) return 'application_url requires source evidence.'
  if (payload.application_opens_at && !evidenceFor(payload, 'application_opens_at')) return 'application_opens_at requires source evidence.'
  if (payload.deadline && !evidenceFor(payload, 'deadline')) return 'deadline requires source evidence.'
  if (['ROLLING', 'OPEN_ENDED'].includes(payload.deadline_type) && !evidenceFor(payload, 'deadline_type')) {
    return `${payload.deadline_type.toLowerCase()} deadline type requires source evidence.`
  }
  if (payload.provider_country && !evidenceFor(payload, 'provider_country')) return 'provider_country requires source evidence.'
  if (payload.application_process && !evidenceFor(payload, 'application_process')) return 'application_process requires source evidence.'
  if (payload.contact_email && !evidenceFor(payload, 'contact_email')) return 'contact_email requires source evidence.'

  return null
}
