'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const browserReasons = [
  'Official page lacks usable content; browser or manual review required.',
  'Official page response headers exceed the native reader limit; browser or manual review required.',
]
type HeldPage = { id: string; selected_official_url: string; outcome_reason: string; browser_approved_url: string | null }

export default function ProgramBrowserApprovals() {
  const [pages, setPages] = useState<HeldPage[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setBusy(true)
    setError('')
    try {
      const { data, error } = await supabase.from('program_discoveries')
        .select('id,selected_official_url,outcome_reason,browser_approved_url')
        .eq('discovery_kind', 'DIRECTORY').in('status', ['RETRY', 'FAILED'])
        .in('outcome_reason', browserReasons).order('first_seen_at').limit(50)
      if (error) throw new Error(error.message)
      if (!Array.isArray(data)) throw new Error('Held pages unavailable')
      setPages(data as HeldPage[])
    } catch (err) {
      setPages(null)
      setError(err instanceof Error ? err.message : 'Unable to load held pages')
    } finally { setBusy(false) }
  }

  async function approve(page: HeldPage) {
    setBusy(true)
    setError('')
    try {
      const { error } = await supabase.rpc('approve_program_browser_read', {
        p_discovery_id: page.id, p_expected_url: page.selected_official_url,
      })
      if (error) throw new Error(error.message)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Browser approval failed')
    } finally { setBusy(false) }
  }

  useEffect(() => { void refresh() }, [])

  return <section aria-labelledby="program-browser-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="program-browser-heading" className="text-lg font-semibold">Pages needing browser reading</h2>
      <button type="button" disabled={busy} onClick={refresh} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">{busy ? 'Loading…' : 'Refresh held pages'}</button>
    </div>
    <p className="mt-2 text-sm text-gray-600">Approve browser reading for the exact URL below. The worker will retry it on its normal schedule. Programs still need your review before publication.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {pages?.length === 0 && <p className="mt-3 text-sm text-gray-600">No pages are awaiting browser reading.</p>}
    {pages && pages.length > 0 && <ul className="mt-4 divide-y divide-gray-200">{pages.map(page => <li key={page.id} className="py-3">
      <p className="break-all text-sm font-medium">{page.selected_official_url}</p>
      <p className="mt-1 text-sm text-gray-600">{page.outcome_reason}</p>
      {page.browser_approved_url === page.selected_official_url
        ? <p className="mt-2 text-sm text-gray-600">Browser reading was already approved. This page needs manual review.</p>
        : <button type="button" disabled={busy} onClick={() => approve(page)} className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50">Approve browser reading</button>}
    </li>)}</ul>}
    {pages?.length === 50 && <p className="mt-3 text-xs text-gray-500">Showing the first 50 held pages.</p>}
  </section>
}
