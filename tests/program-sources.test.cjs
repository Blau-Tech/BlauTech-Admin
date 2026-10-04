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
  const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../components/ProgramSources.tsx'), 'utf8'), {
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

test('directory records distinguish success, unfinished, empty and unavailable', async () => {
  const run={source_key:'hackermap',status:'SUCCEEDED',started_at:'2026-10-04T10:00:00Z',finished_at:'2026-10-04T10:01:00Z'}
  assert.match(text((await panel({data:[run],error:null})).tree),/Collected/)
  assert.match(text((await panel({data:[{...run,status:'STARTED',finished_at:null}],error:null})).tree),/completion not recorded/)
  assert.match(text((await panel({data:[],error:null})).tree),/No check recorded yet/)
  for(const response of [{data:null,error:{message:'denied'}},{data:[{...run,finished_at:null}],error:null}]) {
    const result=text((await panel(response)).tree)
    assert.match(result,/Last check unavailable/)
    assert.doesNotMatch(result,/No check recorded yet/)
  }
})
