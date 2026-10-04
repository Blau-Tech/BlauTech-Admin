const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

async function panel(response) {
  const values = [], calls = []
  let effect, index = 0
  const react = {
    useState(initial) { const i = index++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = value }] },
    useEffect(fn) { effect = fn },
  }
  const client = { from(table) {
    calls.push(['from', table])
    const chain = Object.fromEntries(['select', 'eq', 'in', 'order', 'limit'].map(method => [method, (...args) => {
      calls.push([method, ...args]); return chain
    }]))
    chain.then = (resolve, reject) => Promise.resolve(response).then(resolve, reject)
    return chain
  } }
  const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../components/ProgramReadingFailures.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', compiled)(mod, mod.exports, name => {
    if (name === 'react') return react
    if (name === '@/lib/supabase') return { supabase: client }
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
    throw Error(name)
  })
  const render = () => { index = 0; return mod.exports.default() }
  render(); await effect(); await new Promise(resolve => setImmediate(resolve))
  return { calls, tree: render() }
}
const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : node ?? ''
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : []
const page = { id: 'retry', selected_official_url: 'https://program.example/apply', status: 'RETRY', outcome_reason: 'Page unreadable', attempt_count: 2, available_at: '2026-10-05T10:00:00Z', source_key: 'alpine' }

test('failure inspection is bounded, directory-only and read-only, with distinct retry/exhaustion guidance', async () => {
  const result = await panel({ data: [page, { ...page, id: 'failed', status: 'FAILED' }], error: null })
  assert.deepEqual(result.calls, [
    ['from', 'program_discoveries'],
    ['select', 'id,selected_official_url,status,outcome_reason,attempt_count,available_at,source_key:reader_context->>source_key'],
    ['eq', 'discovery_kind', 'DIRECTORY'], ['in', 'status', ['RETRY', 'FAILED']],
    ['order', 'updated_at', { ascending: false }], ['limit', 50],
  ])
  assert.match(text(result.tree), /Eligible for retry from/)
  assert.match(text(result.tree), /Stopped after failures. No automatic retry/)
  assert.match(text(result.tree), /Primary source: alpine · 2 read attempts/)
  assert.equal(nodes(result.tree).filter(node => node.type === 'button').length, 1)
})

test('permission failures never appear as an empty queue and unsafe URLs are not clickable', async () => {
  const failure = await panel({ data: null, error: { message: 'Permission denied' } })
  assert.match(text(failure.tree), /Permission denied/)
  assert.doesNotMatch(text(failure.tree), /No current reading failures/)
  const unsafe = await panel({ data: [{ ...page, selected_official_url: 'javascript:alert(1)', available_at: 'invalid' }], error: null })
  assert.equal(nodes(unsafe.tree).filter(node => node.type === 'a').length, 0)
  assert.match(text(unsafe.tree), /retry time unavailable/)
})

test('malformed data is unavailable and credential-bearing HTTPS URLs are not clickable', async () => {
  for (const data of [null, [{ ...page, status: 'QUEUED' }], [{ ...page, attempt_count: -1 }]]) {
    const result = await panel({ data, error: null })
    assert.match(text(result.tree), /Reading failures unavailable/)
    assert.doesNotMatch(text(result.tree), /No current reading failures/)
  }
  const result = await panel({ data: [{ ...page, selected_official_url: 'https://user:password@example.com/' }], error: null })
  assert.equal(nodes(result.tree).filter(node => node.type === 'a').length, 0)
})
