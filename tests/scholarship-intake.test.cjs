const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../lib/scholarshipIntake.ts'), 'utf8')
const pageSource = fs.readFileSync(path.join(__dirname, '../app/dashboard/scholarships/page.tsx'), 'utf8')
const componentSource = fs.readFileSync(path.join(__dirname, '../components/ScholarshipIntakePanel.tsx'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText
const intakeModule = { exports: {} }

new Function('module', 'exports', 'require', compiled)(intakeModule, intakeModule.exports, require)

const { buildReviewedScholarship, validateReviewedScholarship } = intakeModule.exports

function previewResult() {
  return {
    accepted: true,
    queued_url: 'https://discovery.example/item',
    source_urls: ['https://provider.example/scholarship'],
    provider: {
      name: 'Example Foundation',
      website_url: 'https://provider.example',
      country: 'Germany',
    },
    scholarship: {
      title: 'Example Scholarship',
      summary: 'Support for bachelor students.',
      description: 'Support for bachelor students applying in Germany.',
      official_url: 'https://provider.example/scholarship',
      application_url: 'https://provider.example/apply',
      applications_open: true,
      application_opens_at: null,
      deadline: null,
      deadline_type: 'OPEN_ENDED',
      application_process: null,
      contact_email: null,
    },
    eligibilities: [{
      key: 'BACHELOR_STUDENTS',
      required: true,
      details: 'bachelor students',
      source_quote: 'Applications are open to bachelor students.',
    }],
    benefits: [{
      key: 'MONTHLY_PAYMENT',
      amount: 500,
      currency: 'eur',
      frequency: 'monthly',
      duration_months: null,
      details: 'EUR 500 monthly',
      source_quote: 'Recipients receive EUR 500 monthly.',
    }],
    evidence: [
      { field: 'title', quote: 'Example Scholarship', source_url: 'https://provider.example/scholarship' },
      { field: 'provider', quote: 'Example Foundation', source_url: 'https://provider.example/scholarship' },
      { field: 'summary', quote: 'Support for bachelor students.', source_url: 'https://provider.example/scholarship' },
      { field: 'description', quote: 'Support for bachelor students applying in Germany.', source_url: 'https://provider.example/scholarship' },
      { field: 'applications_open', quote: 'Applications are accepted at any time.', source_url: 'https://provider.example/scholarship' },
      { field: 'deadline_type', quote: 'Applications are accepted at any time.', source_url: 'https://provider.example/scholarship' },
      { field: 'provider_country', quote: 'Germany', source_url: 'https://provider.example/scholarship' },
      { field: 'official_url', quote: 'https://provider.example/scholarship', source_url: 'https://provider.example/scholarship' },
      { field: 'application_url', quote: 'https://provider.example/apply', source_url: 'https://provider.example/scholarship' },
    ],
  }
}

test('maps a write-free extractor result into the reviewed RPC payload', () => {
  const payload = buildReviewedScholarship(previewResult())

  assert.equal(payload.provider_name, 'Example Foundation')
  assert.equal(payload.benefits[0].currency, 'EUR')
  assert.equal(payload.eligibility_summary, 'bachelor students')
  assert.equal(payload.source_evidence.submitted_url, 'https://discovery.example/item')
  assert.deepEqual(payload.source_evidence.source_urls, ['https://provider.example/scholarship'])
  assert.equal(validateReviewedScholarship(payload), null)
})

test('rejects an eligibility detail that drifts from its exact source quote', () => {
  const payload = buildReviewedScholarship(previewResult())
  payload.eligibilities[0].details = 'master students'

  assert.equal(
    validateReviewedScholarship(payload),
    'Eligibility 1 details must be an exact phrase inside its source quote.'
  )
})

test('requires top-level fields to match their evidence quotes', () => {
  const payload = buildReviewedScholarship(previewResult())
  payload.title = 'Invented title'

  assert.equal(validateReviewedScholarship(payload), 'title must exactly match its source quote.')
})

test('requires proof that applications are currently open', () => {
  const payload = buildReviewedScholarship(previewResult())
  payload.applications_open = false

  assert.equal(
    validateReviewedScholarship(payload),
    'Applications must be verified as open before publication.'
  )
})

test('requires a grounded scholarship benefit', () => {
  const payload = buildReviewedScholarship(previewResult())
  payload.benefits = []

  assert.equal(
    validateReviewedScholarship(payload),
    'At least one grounded scholarship benefit is required.'
  )
})

test('renders the intake only for full admins and publishes through the reviewed RPC', () => {
  assert.match(pageSource, /isAdmin && <ScholarshipIntakePanel/)
  assert.doesNotMatch(pageSource, /universal uploader/)
  assert.match(componentSource, /scholarshipsApi\.preview/)
  assert.match(componentSource, /scholarshipsApi\.publishReviewed/)
  assert.match(componentSource, /Publishing still validates required evidence and exact source quotes/)
})
