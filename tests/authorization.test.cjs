const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../lib/authorization.ts'), 'utf8')
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
  assert.equal(isAllowedWorkflowPath('event-link'), false)
})

test('authorizes LinkedIn cities by protected role and assignment', () => {
  const admin = getAccessClaims({ app_metadata: { role: 'admin' } })
  const berlinLead = getAccessClaims({ app_metadata: { role: 'city_lead', city: 'BERLIN' } })
  const madridLead = getAccessClaims({ app_metadata: { role: 'city_lead', city: 'MADRID' } })

  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', 'MUNICH', admin).allowed, true)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', 'MADRID', admin).status, 400)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', {}, admin).status, 400)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', 'BERLIN', berlinLead).allowed, true)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-events', 'MUNICH', berlinLead).status, 403)
  assert.equal(authorizeWorkflowRequest('blau-network-linkedin-hackathons', 'MADRID', madridLead).allowed, true)
})

test('restricts newsletters to full admins and rejects unknown workflows', () => {
  const admin = getAccessClaims({ app_metadata: { role: 'super_admin' } })
  const cityLead = getAccessClaims({ app_metadata: { role: 'city_lead', city: 'BERLIN' } })

  assert.equal(authorizeWorkflowRequest('blau-network-newsletter', {}, admin).allowed, true)
  assert.equal(authorizeWorkflowRequest('blau-network-newsletter', {}, cityLead).status, 403)
  assert.equal(authorizeWorkflowRequest('not-real', {}, admin).status, 404)
})
