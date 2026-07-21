const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../lib/authorization.ts'), 'utf8')
const routeSource = fs.readFileSync(path.join(__dirname, '../app/api/workflows/[...path]/route.ts'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText
const authorizationModule = { exports: {} }

new Function('module', 'exports', 'require', compiled)(
  authorizationModule,
  authorizationModule.exports,
  require
)

const {
  authorizeWorkflowRequest,
  getAccessClaims,
  isAllowedWorkflowPath,
  resolveN8nWorkflowPath,
  resolveWorkflowCity,
} = authorizationModule.exports

test('allows full admins from protected app metadata', () => {
  assert.deepEqual(getAccessClaims({ app_metadata: { role: 'admin' } }), {
    role: 'admin',
    city: null,
    isAdmin: true,
    isCityLead: false,
    hasAccess: true,
  })
})

test('allows a city lead only with a valid city', () => {
  assert.deepEqual(
    getAccessClaims({ app_metadata: { role: 'city_lead', city: 'BERLIN' } }),
    {
      role: 'city_lead',
      city: 'BERLIN',
      isAdmin: false,
      isCityLead: true,
      hasAccess: true,
    }
  )
})

test('denies city leads with a missing or invalid city', () => {
  for (const city of [undefined, 'HAMBURG', 'berlin']) {
    const claims = getAccessClaims({ app_metadata: { role: 'city_lead', city } })
    assert.equal(claims.hasAccess, false)
    assert.equal(claims.isCityLead, false)
    assert.equal(claims.city, null)
  }
})

test('ignores forged user-editable metadata', () => {
  const claims = getAccessClaims({
    app_metadata: {},
    user_metadata: { role: 'super_admin', city: 'BERLIN' },
  })

  assert.equal(claims.hasAccess, false)
  assert.equal(claims.role, null)
})

test('uses the protected assigned city for city leads and an explicit city for admins', () => {
  assert.equal(resolveWorkflowCity(true, 'BERLIN', 'MUNICH'), 'BERLIN')
  assert.equal(resolveWorkflowCity(true, 'MADRID', null), 'MADRID')
  assert.equal(resolveWorkflowCity(false, null, 'MUNICH'), 'MUNICH')
  assert.equal(resolveWorkflowCity(false, null, null), null)
})

test('allowlists only the deployed Admin workflow paths', () => {
  assert.equal(isAllowedWorkflowPath('blau-network-linkedin-events'), true)
  assert.equal(isAllowedWorkflowPath('blau-network-linkedin-hackathons'), true)
  assert.equal(isAllowedWorkflowPath('blau-network-newsletter'), true)
  assert.equal(isAllowedWorkflowPath('blau-network-linkedin-events-stable'), false)
  assert.equal(isAllowedWorkflowPath('blau-network-linkedin-hackathons-stable'), false)
  assert.equal(isAllowedWorkflowPath('event-link'), false)
})

test('routes Berlin LinkedIn requests to current workflows and other cities to stable workflows', () => {
  assert.equal(
    resolveN8nWorkflowPath('blau-network-linkedin-events', 'BERLIN'),
    'blau-network-linkedin-events'
  )
  assert.equal(
    resolveN8nWorkflowPath('blau-network-linkedin-events', 'MUNICH'),
    'blau-network-linkedin-events-stable'
  )
  assert.equal(
    resolveN8nWorkflowPath('blau-network-linkedin-hackathons', 'MADRID'),
    'blau-network-linkedin-hackathons-stable'
  )
  assert.equal(
    resolveN8nWorkflowPath('blau-network-newsletter', undefined),
    'blau-network-newsletter'
  )
})

test('authorizes the public path before selecting its internal n8n route', () => {
  const authorizationIndex = routeSource.indexOf('authorizeWorkflowRequest(webhookPath, payload')
  const routingIndex = routeSource.indexOf('resolveN8nWorkflowPath(webhookPath, city)')

  assert.notEqual(authorizationIndex, -1)
  assert.ok(routingIndex > authorizationIndex)
  assert.doesNotMatch(routeSource, /authorizeWorkflowRequest\(n8nWebhookPath/)
})

test('authorizes LinkedIn cities by protected role and assignment', () => {
  const admin = getAccessClaims({ app_metadata: { role: 'admin' } })
  const berlinLead = getAccessClaims({ app_metadata: { role: 'city_lead', city: 'BERLIN' } })
  const madridLead = getAccessClaims({ app_metadata: { role: 'city_lead', city: 'MADRID' } })

  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', { city: 'MUNICH', test_mode: false }, admin).allowed, true)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', { city: 'MADRID', test_mode: true }, admin).status, 400)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', { test_mode: true }, admin).status, 400)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', { city: 'BERLIN', test_mode: true }, berlinLead).allowed, true)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', { city: 'MUNICH', test_mode: true }, berlinLead).status, 403)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-hackathons', { city: 'MADRID', test_mode: false }, madridLead).allowed, true)
})

test('restricts newsletters to full admins and rejects unknown workflows', () => {
  const admin = getAccessClaims({ app_metadata: { role: 'super_admin' } })
  const cityLead = getAccessClaims({ app_metadata: { role: 'city_lead', city: 'BERLIN' } })

  assert.equal(authorizeWorkflowRequest('blau-network-newsletter', { test_mode: false }, admin).allowed, true)
  assert.equal(authorizeWorkflowRequest('blau-network-newsletter', { test_mode: true }, cityLead).status, 403)
  assert.equal(authorizeWorkflowRequest('not-real', { test_mode: true }, admin).status, 404)
})

test('requires test_mode to be a real boolean', () => {
  const admin = getAccessClaims({ app_metadata: { role: 'admin' } })

  for (const payload of [undefined, null, {}, { test_mode: 'true' }, { test_mode: 1 }]) {
    assert.equal(authorizeWorkflowRequest('blau-network-newsletter', payload, admin).status, 400)
  }
})
