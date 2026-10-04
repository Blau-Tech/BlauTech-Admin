const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

async function panel(response, requestResponse) {
  const values = [], calls = []
  let effects = [], index = 0
  const timers = []
  let now=Date.now()
  const clock=class extends Date { static now() { return now } }
  const react = {
    useState(initial) { const i = index++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = value }] },
    useEffect(fn) { effects.push(fn) },
  }
  const client = { auth: { getSession: async () => ({data:{session:{access_token:'test-session'}}}) }, from(table) {
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
  new Function('module', 'exports', 'require', 'fetch', 'setTimeout', 'clearTimeout', 'Date', compiled)(mod, mod.exports, name => {
    if (name === 'react') return react
    if (name === '@/lib/supabase') return { supabase: client }
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
    throw Error(name)
  }, async (url,options) => { calls.push(['fetch',url,options]); return requestResponse }, fn => { timers.push(fn); return fn }, fn => { const i=timers.indexOf(fn); if(i>=0) timers.splice(i,1) }, clock)
  const render = () => { index = 0; effects = []; return mod.exports.default() }
  render(); await effects[0](); await new Promise(resolve => setImmediate(resolve))
  return { calls, tree: render(), render, monitor: () => { render(); return effects[1]() }, timers, advanceClock: ms => { now+=ms }, setResponse: value => { response=value } }
}
const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : node ?? ''
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : []

test('directory records distinguish success, unfinished, empty and unavailable', async () => {
  const run={execution_id:'1',source_key:'hackermap',status:'SUCCEEDED',started_at:'2026-10-04T10:00:00Z',finished_at:'2026-10-04T10:01:00Z'}
  assert.match(text((await panel({data:[run],error:null})).tree),/Collected/)
  assert.match(text((await panel({data:[{...run,status:'STARTED',finished_at:null}],error:null})).tree),/completion not recorded/)
  assert.match(text((await panel({data:[],error:null})).tree),/No check recorded yet/)
  for(const response of [{data:null,error:{message:'denied'}},{data:[{...run,finished_at:null}],error:null}]) {
    const result=text((await panel(response)).tree)
    assert.match(result,/Last check unavailable/)
    assert.doesNotMatch(result,/No check recorded yet/)
  }
})

test('Check now accepts successful HTTP responses and reports rejected requests', async () => {
  for(const status of [200,202,403]) {
    const result=await panel({data:[],error:null},{status,ok:status<300})
    await nodes(result.tree).find(node=>node.type==='button' && text(node)==='Check now').props.onClick()
    assert.match(text(result.render()),status<300 ? /Collection requested/ : /Could not start collection/)
    const call=result.calls.find(call=>call[0]==='fetch')
    assert.equal(call[1],'/api/workflows/program-directory-alpine-hacker-houses')
    assert.equal(call[2].body,'{}')
    assert.equal(call[2].headers.Authorization,'Bearer test-session')
  }
})

test('automatic refresh waits for a new completed execution and cancels its timer', async () => {
  const old={execution_id:'1',source_key:'alpine-hacker-houses',status:'SUCCEEDED',started_at:'2026-10-04T10:00:00Z',finished_at:'2026-10-04T10:01:00Z'}
  const result=await panel({data:[old],error:null},{status:200,ok:true})
  await nodes(result.tree).find(node=>node.type==='button' && text(node)==='Check now').props.onClick()
  const cleanup=result.monitor()
  assert.doesNotMatch(text(result.render()),/check finished/,'An older successful run is not this request')
  assert.equal(result.timers.length,1)
  cleanup(); assert.equal(result.timers.length,0,'Unmount cancels polling')
  result.monitor()
  result.setResponse({data:[{...old,execution_id:'2'}],error:null})
  await result.timers.shift()(); await new Promise(resolve=>setImmediate(resolve))
  result.monitor()
  assert.match(text(result.render()),/Alpine Valley check finished/)
  result.monitor(); assert.equal(result.timers.length,0,'Completion stops polling')
})

test('unconfirmed requests stop automatic refresh after two minutes', async () => {
  const result=await panel({data:[],error:null},{status:200,ok:true})
  await nodes(result.tree).find(node=>node.type==='button' && text(node)==='Check now').props.onClick()
  result.advanceClock(120001)
  result.monitor()
  assert.match(text(result.render()),/Completion not confirmed yet/)
  assert.equal(result.timers.length,0)
  assert.doesNotMatch(text(result.render()),/check finished/)
})

test('a new failure ends automatic updates and keeps retry available', async () => {
 const old={execution_id:'1',source_key:'alpine-hacker-houses',status:'SUCCEEDED',started_at:'2026-10-04T10:00:00Z',finished_at:'2026-10-04T10:01:00Z'}
 const result=await panel({data:[old],error:null},{status:200,ok:true})
 await nodes(result.tree).find(node=>node.type==='button' && text(node)==='Check now').props.onClick()
 result.monitor()
 result.setResponse({data:[{...old,execution_id:'2',status:'FAILED'}],error:null})
 await result.timers.shift()(); await new Promise(resolve=>setImmediate(resolve))
 result.monitor()
 const tree=result.render()
 assert.match(text(tree),/Check failed/)
 assert.match(text(tree),/You can try Check now again/)
 assert.doesNotMatch(text(tree),/check finished/)
 assert.equal(nodes(tree).find(node=>node.type==='button' && text(node)==='Check now').props.disabled,false)
 result.monitor(); assert.equal(result.timers.length,0)
})
