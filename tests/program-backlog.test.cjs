const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

async function loadPanel(response, sourceResult = { data: [], error: null }) {
  const values = [], queries = []
  let effect, index = 0
  const react = {
    useState(initial) { const i = index++; values[i] = initial; return [initial, value => { values[i] = value }] },
    useEffect(callback) { effect = callback },
  }
  const supabase = { rpc: async name => { assert.equal(name, 'program_directory_source_counts'); return sourceResult }, from(table) {
    const query = { table, filters: [] }; queries.push(query)
    return { select(field, options) {
      query.field = field; query.options = options
      return { eq(key, value) {
        query.filters.push([key, value])
        return { eq(key, value) { query.filters.push([key, value]); return Promise.resolve(response(value)) } }
      } }
    } }
  } }
  const source = fs.readFileSync(require.resolve('../components/ProgramBacklogStatus.tsx'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const mod = { exports: {} }
  new Function('module','exports','require',compiled)(mod, mod.exports, name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null }
    if (name === '@/lib/supabase') return { supabase }
    throw Error(name)
  })
  mod.exports.default(); effect()
  await new Promise(resolve => setImmediate(resolve))
  return { values, queries }
}

test('queue counts use exact directory-only queries and preserve real zeros', async () => {
  const { values, queries } = await loadPanel(status => ({ count: status === 'QUEUED' ? 172 : 0, error: null }))
  assert.deepEqual(values[0], [172,0,0,0,0,0])
  assert.equal(Object.keys(values[1]).length, 0)
  assert.equal(values[2], '')
  assert.equal(values[3], false)
  assert.equal(queries.length, 6)
  for (const query of queries) {
    assert.equal(query.table, 'program_discoveries')
    assert.deepEqual(query.options, { count: 'exact', head: true })
    assert.deepEqual(query.filters[0], ['discovery_kind', 'DIRECTORY'])
  }
})

test('an unavailable count never appears as an empty queue', async () => {
  for (const response of [{ count: null, error: null }, { count: null, error: { message: 'Permission denied' } }]) {
    const { values } = await loadPanel(() => response)
    assert.equal(values[0], null)
    assert.ok(values[2])
    assert.equal(values[3], false)
  }
})


test('source counts retain status totals without treating handoffs as approvals', async () => {
  const { values } = await loadPanel(() => ({ count: 0, error: null }), { data: [
    { source_url: 'https://directory.example/list', status: 'QUEUED', candidates: 172 },
    { source_url: 'https://directory.example/list', status: 'PENDING_REVIEW', candidates: 2 },
  ], error: null })
  assert.equal(values[1]['https://directory.example/list'].QUEUED, 172)
  assert.equal(values[1]['https://directory.example/list'].PENDING_REVIEW, 2)
  assert.equal(values[1]['https://directory.example/list'].APPROVED, undefined)
})

test('failed source statistics leave counts unavailable', async () => {
  const { values } = await loadPanel(() => ({ count: 0, error: null }), { data: null, error: { message: 'RPC unavailable' } })
  assert.equal(values[0], null)
  assert.equal(values[1], null)
  assert.equal(values[2], 'RPC unavailable')
})
