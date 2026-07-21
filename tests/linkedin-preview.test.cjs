const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../lib/linkedinPreview.ts'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText
const previewModule = { exports: {} }

new Function('module', 'exports', 'require', compiled)(
  previewModule,
  previewModule.exports,
  require
)

const { selectLinkedInPreview } = previewModule.exports

test('selects eligible LinkedIn items in highlight, partner, date, time, and id order', () => {
  const defaults = { city: 'BERLIN', is_published: true, start_date: '2030-05-03' }
  const candidates = [
    { ...defaults, id: 'plain', name: 'Plain' },
    { ...defaults, id: 'partner', name: 'Partner', partner_event: true, start_date: '2030-05-04' },
    { ...defaults, id: 'highlight-early', name: 'Highlight Early', is_highlight: true, start_date: '2030-05-02' },
    { ...defaults, id: 'highlight-b', name: 'Highlight B', is_highlight: true, start_time: '09:00' },
    { ...defaults, id: 'highlight-a', name: 'Highlight A', is_highlight: true, start_time: '09:00' },
    { ...defaults, id: 'highlight-late', name: 'Highlight Late', is_highlight: true, start_time: '10:00' },
    { ...defaults, id: 'drafted', name: 'Drafted', drafted_linkedin: true },
    { ...defaults, id: 'posted', name: 'Posted', posted_linkedin: true },
    { ...defaults, id: 'unpublished', name: 'Unpublished', is_published: false },
    { ...defaults, id: 'today', name: 'Today', start_date: '2030-05-01' },
    { ...defaults, id: 'wrong-city', name: 'Wrong city', city: 'MUNICH' },
  ]

  assert.deepEqual(
    selectLinkedInPreview(candidates, 'BERLIN', '2030-05-01', 10).map((item) => item.id),
    ['highlight-early', 'highlight-a', 'highlight-b', 'highlight-late', 'partner', 'plain']
  )
  assert.deepEqual(
    selectLinkedInPreview(candidates, 'BERLIN', '2030-05-01', 2).map((item) => item.id),
    ['highlight-early', 'highlight-a']
  )
})
