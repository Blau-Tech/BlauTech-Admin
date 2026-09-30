const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

function load(filename, dependencies = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', 'require', compiled)(module, module.exports, (name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
    return dependencies[name]
  })
  return module.exports
}

const authorization = load('authorization.ts')
const admin = { id: 'admin-id', email: 'admin@example.com', app_metadata: { role: 'admin' } }
const password = 'a-long-new-password'

function setup(overrides = {}) {
  const calls = []
  const auth = {
    getUser: async () => { calls.push('getUser'); return { data: { user: admin }, error: null } },
    updateUser: async (attributes) => { calls.push(['updateUser', attributes]); return { error: null } },
    signOut: async () => { calls.push('signOut'); return { error: null } },
    ...overrides,
  }
  return { ...load('passwordSetup.ts', { './supabase': { supabase: { auth } }, './authorization': authorization }), calls }
}

test('password setup verifies the user before changing only their password and signing out', async () => {
  const flow = setup()
  assert.deepEqual(await flow.getPasswordSetupUser(), admin)
  assert.deepEqual(await flow.setAdminPassword(password, password, admin.id), { signedOut: true })
  assert.deepEqual(flow.calls, ['getUser', 'getUser', ['updateUser', { password }], 'signOut'])
})

test('short or mismatched passwords do not make auth requests', async () => {
  const flow = setup()
  await assert.rejects(flow.setAdminPassword('short', 'short', admin.id), /at least 12/)
  await assert.rejects(flow.setAdminPassword(password, 'different-password', admin.id), /do not match/)
  assert.deepEqual(flow.calls, [])
})

test('missing, expired, unauthorized and changed accounts cannot update a password', async () => {
  for (const [response, expected] of [
    [{ data: { user: null }, error: null }, /missing or expired/],
    [{ data: { user: null }, error: { status: 401 } }, /missing or expired/],
    [{ data: { user: null }, error: { name: 'AuthSessionMissingError' } }, /missing or expired/],
    [{ data: { user: { ...admin, app_metadata: {}, user_metadata: { role: 'admin' } } }, error: null }, /does not have permission/],
    [{ data: { user: { ...admin, id: 'other-admin' } }, error: null }, /account changed/],
  ]) {
    const flow = setup({ getUser: async () => response })
    await assert.rejects(flow.setAdminPassword(password, password, admin.id), expected)
    assert.deepEqual(flow.calls, [])
  }
})

test('network verification errors and failed updates do not claim success or sign out', async () => {
  const offline = setup({ getUser: async () => ({ data: { user: null }, error: { status: 0 } }) })
  await assert.rejects(offline.getPasswordSetupUser(), /Check your connection/)
  assert.deepEqual(offline.calls, [])
  const failed = setup({ updateUser: async () => ({ error: new Error('Password rejected') }) })
  await assert.rejects(failed.setAdminPassword(password, password, admin.id), /Password rejected/)
  assert.deepEqual(failed.calls, ['getUser'])
})

test('a sign-out error or exception still reports that the password was saved', async () => {
  for (const signOut of [
    async () => ({ error: new Error('Unavailable') }),
    async () => { throw new Error('Offline') },
  ]) {
    const flow = setup({ signOut })
    assert.deepEqual(await flow.setAdminPassword(password, password, admin.id), { signedOut: false })
    assert.deepEqual(flow.calls, ['getUser', ['updateUser', { password }]])
  }
})
