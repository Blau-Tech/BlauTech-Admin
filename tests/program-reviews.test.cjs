const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

function apiWith(supabase) {
  const source = fs.readFileSync(path.join(__dirname, '../lib/programReviews.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', compiled)(mod, mod.exports, () => ({ supabase }))
  return mod.exports.programReviewsApi
}

test('manual links and updates queue privately instead of writing opportunities', async () => {
  const calls = []
  const api = apiWith({ rpc: async (...args) => { calls.push(args); return { data: [{ status: 'PENDING_REVIEW', review_id: 'r1' }] } } })
  const result = await api.submit({ title: 'Individual Fellowship', url: 'https://example.org/apply' }, 'existing-opportunity')
  assert.equal(result.status, 'PENDING_REVIEW')
  assert.equal(calls[0][0], 'submit_program_review')
  assert.equal(calls[0][1].p_opportunity_id, 'existing-opportunity')
  assert.equal(calls[0][1].p_listing.clean_url, 'https://example.org/apply')
})

test('approval sends the displayed version and requires explicit recheck and sharing choices', async () => {
  const calls = []
  const api = apiWith({ rpc: async (...args) => { calls.push(args); return { data: { status: 'APPROVED' } } } })
  const review = { id: 'r1', version: 7 }
  const listing = { title: 'Reviewed title' }
  await api.decide(review, listing, { action: 'APPROVE' })
  assert.deepEqual(calls[0], ['decide_program_review', {
    p_review_id: 'r1', p_expected_version: 7, p_decision: 'APPROVE', p_listing: listing,
    p_reason: null, p_official_page_checked: false, p_new_application_round: false,
  }])
  await api.decide(review, listing, { action: 'APPROVE', officialPageChecked: true, newApplicationRound: true })
  assert.equal(calls[1][1].p_official_page_checked, true)
  assert.equal(calls[1][1].p_new_application_round, true)
})

test('rejection records the reason without applying any proposed content', async () => {
  const api = apiWith({ rpc: async (name, args) => {
    assert.equal(args.p_decision, 'REJECT')
    assert.equal(args.p_listing, null)
    assert.equal(args.p_reason, 'Company required')
    return { data: { status: 'REJECTED' } }
  } })
  assert.equal((await api.decide({ id: 'r1', version: 2 }, { title: 'Changed' }, { action: 'REJECT', reason: ' Company required ' })).status, 'REJECTED')
})

test('stale version and permission failures propagate for review instead of retrying approval', async () => {
  const error = new Error('The proposal changed; reload before deciding')
  let calls = 0
  const api = apiWith({ rpc: async () => { calls++; return { error } } })
  await assert.rejects(api.decide({ id: 'r1', version: 2 }, {}, { action: 'APPROVE' }), error)
  assert.equal(calls, 1)
})
