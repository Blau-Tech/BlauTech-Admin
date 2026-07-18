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

const { getAccessClaims } = authorizationModule.exports

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
