'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type HeldPage = { id: string; selected_official_url: string; outcome_reason: string; attempt_count: number; updated_at: string }

function reviewIssue(reason: string) {
  switch (reason) {
    case 'Program identity or category needs review.':
      return ['Program unclear', 'Check which named program this page offers and what type it is.']
    case 'Program name is not verified by an exact source quote.':
      return ['Program name unclear', 'Find the program name on the official page.']
    case 'Program category is not established by the source.':
      return ['Program type unclear', 'Check whether this is a fellowship, residency or learning program.']
    case 'Multiple program identities need to be separated before review.':
      return ['Several programs found', 'Find a page for the specific program you want to review.']
    case 'Official website publisher ownership needs manual review.':
      return ['Official source unclear', 'Check that the page belongs to the program organiser. An article about it is not the official source.']
    case 'Employment versus standalone program participation needs manual review.':
      return ['Job or program?', 'Check whether this is a standalone program. Ordinary jobs and internships are outside our focus.']
    default:
      return ['Review needed', 'Open the page and check the recorded reason below.']
  }
}

export default function ProgramEvidenceHolds() {
  const [pages, setPages] = useState<HeldPage[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setBusy(true)
    setError('')
    try {
      const { data, error } = await supabase.from('program_discoveries')
        .select('id,selected_official_url,outcome_reason,attempt_count,updated_at')
        .eq('discovery_kind', 'DIRECTORY').eq('status', 'MANUAL_REVIEW')
        .order('first_seen_at').limit(50)
      if (error) throw new Error(error.message)
      if (!Array.isArray(data)) throw new Error('Held pages unavailable')
      setPages(data as HeldPage[])
    } catch (err) {
      setPages(null)
      setError(err instanceof Error ? err.message : 'Unable to load held pages')
    } finally { setBusy(false) }
  }

  async function decide(page: HeldPage, decision: 'RECHECK' | 'DISMISS') {
    const reason = notes[page.id]?.trim()
    if (!reason || busy || (decision === 'RECHECK' && page.attempt_count >= 5)) return
    setBusy(true)
    setError('')
    try {
      const { error } = await supabase.rpc('decide_program_evidence_hold', {
        p_discovery_id: page.id, p_expected_updated_at: page.updated_at,
        p_decision: decision, p_reason: reason,
      })
      if (error) throw new Error(error.message)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision failed')
    } finally { setBusy(false) }
  }

  useEffect(() => { void refresh() }, [])

  return <section aria-labelledby="program-evidence-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="program-evidence-heading" className="text-lg font-semibold">Pages needing a human check</h2>
      <button type="button" disabled={busy} onClick={refresh} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">{busy ? 'Loading…' : 'Refresh evidence holds'}</button>
    </div>
    <p className="mt-2 text-sm text-gray-600">Check the page, add a note, then recheck or dismiss. Rechecks run on the normal schedule.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {pages?.length === 0 && <p className="mt-3 text-sm text-gray-600">No pages are awaiting a human check.</p>}
    {pages && pages.length > 0 && <ul className="mt-4 divide-y divide-gray-200">{pages.map(page => { const [label, nextAction] = reviewIssue(page.outcome_reason); return <li key={page.id} className="py-3">
      <a href={page.selected_official_url} target="_blank" rel="noopener noreferrer" className="break-all text-sm font-medium underline">{page.selected_official_url}</a>
      <p className="mt-2 text-sm font-medium text-amber-800">{label}</p>
      <p className="mt-1 text-sm text-gray-600">{nextAction}</p>
      <details className="mt-2 text-xs text-gray-500"><summary className="cursor-pointer">Recorded reason</summary><p className="mt-1">{page.outcome_reason}</p></details>
      <label className="mt-2 block text-sm">Review note
        <input value={notes[page.id] || ''} maxLength={1000} onChange={event => setNotes(current => ({ ...current, [page.id]: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={busy || !notes[page.id]?.trim() || page.attempt_count >= 5} onClick={() => decide(page, 'RECHECK')} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50">Recheck page</button>
        <button type="button" disabled={busy || !notes[page.id]?.trim()} onClick={() => decide(page, 'DISMISS')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">Dismiss</button>
      </div>
      {page.attempt_count >= 5 && <p className="mt-2 text-sm text-gray-600">This page has reached its five-read limit. Inspect it manually or dismiss it.</p>}
    </li>})}</ul>}
    {pages?.length === 50 && <p className="mt-3 text-xs text-gray-500">Showing the first 50 held pages.</p>}
  </section>
}
