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
