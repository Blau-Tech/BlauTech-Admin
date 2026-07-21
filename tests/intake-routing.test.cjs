const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const pageSource = fs.readFileSync(path.join(__dirname, '../app/dashboard/events/page.tsx'), 'utf8')
const handlerStart = pageSource.indexOf('const handleSubmitLink')
const handlerEnd = pageSource.indexOf('// Helper function to format date and time', handlerStart)
const handlerSource = pageSource.slice(handlerStart, handlerEnd)
const envExample = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8')

test('routes Berlin intake separately without falling back to the stable endpoint', () => {
  assert.match(
    handlerSource,
    /const url = city === 'BERLIN'\s*\? process\.env\.NEXT_PUBLIC_N8N_BERLIN_EVENT_INTAKE_URL\s*: process\.env\.NEXT_PUBLIC_N8N_EVENT_INTAKE_URL/
  )
  assert.doesNotMatch(handlerSource, /NEXT_PUBLIC_N8N_BERLIN_EVENT_INTAKE_URL\s*\|\|/)
})

test('validates the link and city before selecting an intake endpoint', () => {
  const linkValidation = handlerSource.indexOf('if (!linkUrl.trim())')
  const cityValidation = handlerSource.indexOf('if (!city || !CITY_OPTIONS.includes')
  const endpointSelection = handlerSource.indexOf("const url = city === 'BERLIN'")
  const endpointValidation = handlerSource.indexOf('if (!url)')
  const request = handlerSource.indexOf('await fetch(url')

  assert.ok(linkValidation >= 0)
  assert.ok(linkValidation < cityValidation)
  assert.ok(cityValidation < endpointSelection)
  assert.ok(endpointSelection < endpointValidation)
  assert.ok(endpointValidation < request)
})

test('documents the stable and Berlin intake endpoints', () => {
  assert.match(
    envExample,
    /^NEXT_PUBLIC_N8N_EVENT_INTAKE_URL=https:\/\/blautech-n8n\.click\/webhook\/events-new-stable$/m
  )
  assert.match(
    envExample,
    /^NEXT_PUBLIC_N8N_BERLIN_EVENT_INTAKE_URL=https:\/\/blautech-n8n\.click\/webhook\/events-new$/m
  )
})
