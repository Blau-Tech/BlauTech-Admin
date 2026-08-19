const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

test('manual listings default to published while existing drafts stay unpublished', () => {
  for (const name of ['Event', 'Hackathon', 'Opportunity', 'Scholarship']) {
    const source = fs.readFileSync(path.join(__dirname, `../components/${name}Form.tsx`), 'utf8')

    assert.match(source, /is_published: initialData\.is_published \?\? true/)
    assert.match(source, /is_published: true/)
    assert.match(source, /is_published: !!data\.is_published/)
  }
})

test('new fellowships and programs use one Program category', () => {
  const form = fs.readFileSync(path.join(__dirname, '../components/OpportunityForm.tsx'), 'utf8')
  const page = fs.readFileSync(path.join(__dirname, '../app/dashboard/opportunities/page.tsx'), 'utf8')

  assert.match(form, /opportunity_type: 'PROGRAM'/)
  assert.doesNotMatch(form, /option value="FELLOWSHIP"/)
  assert.match(page, /FELLOWSHIP: 'Program'/)
})

test('event and hackathon publishing controls do not expose highlights', () => {
  const files = [
    '../components/EventForm.tsx',
    '../components/HackathonForm.tsx',
    '../components/EventDetailView.tsx',
    '../components/HackathonDetailView.tsx',
    '../app/dashboard/events/page.tsx',
    '../app/dashboard/hackathons/page.tsx',
  ]

  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8')
    assert.doesNotMatch(source, /is_highlight|highlight/i, file)
  }

  for (const name of ['Event', 'Hackathon']) {
    const source = fs.readFileSync(path.join(__dirname, `../components/${name}Form.tsx`), 'utf8')
    assert.match(source, /partner_event/, `${name} partner control remains`)
  }

  for (const name of ['Scholarship', 'Opportunity', 'Organisation']) {
    const source = fs.readFileSync(path.join(__dirname, `../components/${name}Form.tsx`), 'utf8')
    assert.match(source, /is_highlight/, `${name} highlight control remains`)
  }
})

test('workflow confirmation copy describes selection without highlight instructions', () => {
  const dashboard = fs.readFileSync(path.join(__dirname, '../app/dashboard/page.tsx'), 'utf8')

  assert.doesNotMatch(dashboard, /Have you highlighted|Highlights and partner/)
  assert.match(dashboard, /Partner events are prioritised/)
  assert.match(dashboard, /Eligible published, unposted items are selected automatically by date/)
})
