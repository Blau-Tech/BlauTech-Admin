const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../lib/linkedinDiscovery.ts'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const loaded = { exports: {} }
new Function('module', 'exports', compiled)(loaded, loaded.exports)
const { canonicalizeLinkedInPostUrl } = loaded.exports

test('canonicalizes supported LinkedIn post URLs', () => {
  assert.equal(
    canonicalizeLinkedInPostUrl('https://m.linkedin.com/feed/update/urn:li:activity:123/?utm_source=x#part'),
    'https://www.linkedin.com/feed/update/urn:li:activity:123'
  )
  assert.equal(
    canonicalizeLinkedInPostUrl('https://de.linkedin.com/posts/person_event-activity-123-x?trk=abc'),
    'https://www.linkedin.com/posts/person_event-activity-123-x'
  )
})

test('rejects private, insecure, and non-post URLs', () => {
  for (const url of [
    'http://www.linkedin.com/posts/person_post',
    'https://evil.example/posts/person_post',
    'https://www.linkedin.com/in/person',
    'https://user:secret@www.linkedin.com/posts/person_post',
  ]) assert.throws(() => canonicalizeLinkedInPostUrl(url))
})
