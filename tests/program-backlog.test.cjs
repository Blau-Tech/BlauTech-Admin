const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

async function loadPanel(response, sourceResult = { data: [], error: null }, metrics = {}) {
  const values = [], queries = []
  let effect, index = 0
  const react = {
    useState(initial) { const i = index++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = value }] },
    useEffect(callback) { effect = callback },
  }
  const supabase = { rpc: async name => { assert.equal(name, 'program_directory_source_counts'); return sourceResult }, from(table) {
    const query = { table, filters: [] }; queries.push(query)
    const chain = {
      select(field, options) { query.field = field; query.options = options; return chain },
      eq(key, value) { query.filters.push([key, value]); return chain },
      gte(key, value) { query.filters.push([key, value]); return chain },
      lte(key, value) { query.filters.push([key, value]); return chain },
      order(key, options) { query.order = [key, options]; return chain },
      limit(value) { query.limit = value; return chain },
      then(resolve, reject) {
        const status = query.filters.find(([key]) => key === 'status')?.[1]
        const result = query.field.startsWith('selected_official_url,') ? metrics.deadlines || { data: [], error: null } : query.field === 'available_at'
          ? metrics.oldest || { data: response('QUEUED').count ? [{ available_at: '2026-10-01T10:00:00Z' }] : [], error: null }
          : query.filters.some(([key]) => key === 'completed_at') ? metrics.completed || { count: 0, error: null } : response(status)
        return Promise.resolve(result).then(resolve, reject)
      },
    }
    return chain
  } }
  const source = fs.readFileSync(require.resolve('../components/ProgramBacklogStatus.tsx'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const mod = { exports: {} }
  new Function('module','exports','require',compiled)(mod, mod.exports, name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return { jsx: (type,props) => ({type,props}), jsxs: (type,props) => ({type,props}) }
    if (name === '@/lib/supabase') return { supabase }
    throw Error(name)
  })
  mod.exports.default(); effect()
  await new Promise(resolve => setImmediate(resolve))
  const render = () => { index = 0; return mod.exports.default() }
  return { values, queries, render }
}

test('queue counts use exact directory-only queries and preserve real zeros', async () => {
  const { values, queries } = await loadPanel(status => ({ count: status === 'QUEUED' ? 172 : 0, error: null }))
  assert.deepEqual(values[0], [172,0,0,0,0,0,0,0])
  assert.equal(Object.keys(values[1]).length, 0)
  assert.equal(values[2], '')
  assert.equal(values[3], false)
  assert.equal(queries.length, 11)
  for (const query of queries.slice(0,8)) {
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


test('capacity uses queue availability age and bounded completion count', async () => {
  const {values,queries}=await loadPanel(()=>({count:181,error:null}),undefined,{completed:{count:7,error:null}})
  assert.deepEqual(values[4],{oldest:'2026-10-01T10:00:00Z',completed:7})
  assert.deepEqual(queries[8].order,['available_at',{ascending:true}])
  assert.equal(queries[8].limit,1)
  assert.deepEqual(queries[8].filters,[['discovery_kind','DIRECTORY'],['status','QUEUED']])
  assert.equal(queries[9].filters[1][0],'completed_at')
  assert(Number.isFinite(Date.parse(queries[9].filters[1][1])))
})

test('failed or malformed capacity never displays a false zero', async () => {
  for(const metrics of [
    {oldest:{data:[{available_at:'invalid'}],error:null}},
    {oldest:{data:[],error:null}},
    {completed:{count:null,error:null}},
    {completed:{count:0,error:{message:'Permission denied'}}},
  ]) {
    const {values}=await loadPanel(()=>({count:181,error:null}),undefined,metrics)
    assert.equal(values[4],null)
    assert.equal(values[0],null)
    assert.ok(values[2])
  }
})

test('paused candidates are visible separately from waiting and retries', async () => {
  const { values } = await loadPanel(status => ({ count: status === 'PAUSED' ? 171 : 0, error: null }), { data: [
    { source_url: 'https://old-source.example', status: 'PAUSED', candidates: 171 },
  ], error: null });
  assert.deepEqual(values[0], [0,0,0,0,0,0,171,0]);
  assert.equal(values[1]['https://old-source.example'].PAUSED, 171);
});

function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join(' ')
  if (node && typeof node === 'object') return textOf(node.props?.children)
  return typeof node === 'string' || typeof node === 'number' ? String(node) : ''
}
function rowsOf(node) {
  if (Array.isArray(node)) return node.flatMap(rowsOf)
  if (!node || typeof node !== 'object') return []
  return [...(node.type === 'tr' ? [textOf(node).replace(/\s+/g,' ')] : []), ...rowsOf(node.props?.children)]
}
test('simple source totals keep human checks, retries and set-aside links distinct', async () => {
  const {render} = await loadPanel(() => ({count:0,error:null}), {data:[
    {source_url:'https://unclear.example',status:'MANUAL_REVIEW',candidates:3},
    {source_url:'https://unclear.example',status:'PENDING_REVIEW',candidates:2},
    {source_url:'https://broken.example',status:'RETRY',candidates:1},
    {source_url:'https://broken.example',status:'FAILED',candidates:4},
    {source_url:'https://excluded.example',status:'REJECTED',candidates:7},
    {source_url:'https://excluded.example',status:'PAUSED',candidates:170},
    {source_url:'https://new.example',status:'QUEUED',candidates:6},
    {source_url:'https://new.example',status:'PROCESSING',candidates:2},
  ],error:null})
  const rows=rowsOf(render())
  assert.match(rows.find(row=>row.includes('https://unclear.example')), /3 links Human check/)
  assert.match(rows.find(row=>row.includes('https://broken.example')), /5 links Reading issue/)
  const excluded=rows.find(row=>row.includes('https://excluded.example'))
  assert.match(excluded,/7 excluded · 170 paused/)
  assert.doesNotMatch(excluded,/Human check|Reading issue/)
  assert.match(rows.find(row=>row.includes('https://new.example')), /6 waiting · 2 checking.* 8 0 None/)
  assert.match(textOf(render()),/not source uptime or a success rate/)
})
test('flow preserves separate counts and uses readable source names', async () => {
  const counts={QUEUED:19,PROCESSING:2,RETRY:1,PENDING_REVIEW:8,FAILED:3,REJECTED:1,PAUSED:170,MANUAL_REVIEW:4}
  const {render}=await loadPanel(status=>({count:counts[status],error:null}),{data:[
    {source_url:'https://search.brave.com/search?q=%22student%20program%22',status:'QUEUED',candidates:6},
    {source_url:'https://www.alpine-valley.com/hacker-houses',status:'PENDING_REVIEW',candidates:3},
  ],error:null})
  const text=textOf(render()).replace(/\s+/g,' ')
  assert.match(text,/1. Waiting 19/)
  assert.match(text,/2. Checking 2/)
  assert.match(text,/3. Sent to review 8/)
  assert.match(text,/4 need your help/)
  assert.match(text,/1 retrying · 3 stopped/)
  assert.match(text,/170 paused · 1 excluded/)
  assert.match(text,/Brave · student programs/)
  assert.match(text,/Alpine Valley/)
})
test('malformed source counts never produce a healthy zero', async () => {
  for (const candidates of [null,'',false,'-1','not-a-number']) {
    const {values}=await loadPanel(()=>({count:0,error:null}),{data:[{source_url:'https://bad.example',status:'FAILED',candidates}],error:null})
    assert.equal(values[1],null);assert.equal(values[5],null);assert.match(values[2],/Invalid source count/)
  }
})


test('upcoming hints are a bounded directory-only list and never confirmed dates', async () => {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const {render,queries}=await loadPanel(()=>({count:1,error:null}),undefined,{deadlines:{data:[{selected_official_url:'https://program.example/',name:'Builder Fellowship',deadline:today}],error:null}})
  const query=queries[10]
  assert.equal(query.limit,3)
  assert.deepEqual(query.filters.slice(0,2),[['discovery_kind','DIRECTORY'],['status','QUEUED']])
  assert(query.filters.some(([key])=>key==='available_at'))
  const text=textOf(render())
  assert.match(text,/Coming up first/)
  assert.match(text,/Builder Fellowship/)
  assert.match(text,/still need verification/)
  const malformed=await loadPanel(()=>({count:1,error:null}),undefined,{deadlines:{data:[{selected_official_url:'javascript:alert(1)',deadline:today}],error:null}})
  assert.equal(malformed.values[0],null)
  assert.match(malformed.values[2],/Invalid program link/)
})
