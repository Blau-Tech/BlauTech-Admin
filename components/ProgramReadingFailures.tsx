'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type FailedPage = {
  id: string
  selected_official_url: string
  status: 'RETRY' | 'FAILED'
  outcome_reason: string | null
  attempt_count: number
  available_at: string | null
  source_key: string | null
}

function safePageUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch { return null }
}

export default function ProgramReadingFailures() {
  const [pages, setPages] = useState<FailedPage[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.from('program_discoveries')
        .select('id,selected_official_url,status,outcome_reason,attempt_count,available_at,source_key:reader_context->>source_key')
        .eq('discovery_kind', 'DIRECTORY').in('status', ['RETRY', 'FAILED'])
        .order('updated_at', { ascending: false }).limit(50)
      if (error) throw new Error(error.message)
      if (!Array.isArray(data) || data.some(page => !page || typeof page.id !== 'string'
        || typeof page.selected_official_url !== 'string' || !['RETRY', 'FAILED'].includes(page.status)
        || !Number.isSafeInteger(page.attempt_count) || page.attempt_count < 0
        || (page.outcome_reason !== null && typeof page.outcome_reason !== 'string')
        || (page.available_at !== null && typeof page.available_at !== 'string')
        || (page.source_key !== null && typeof page.source_key !== 'string'))) throw new Error('Reading failures unavailable')
      setPages(data as FailedPage[])
    } catch (err) {
      setPages(null)
      setError(err instanceof Error ? err.message : 'Unable to load reading failures')
    } finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [])

  return <section id="program-reading-failures" aria-labelledby="program-reading-failures-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="program-reading-failures-heading" className="text-lg font-semibold">Pages with reading failures</h2>
      <button type="button" disabled={loading} onClick={refresh} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">{loading ? 'Loading…' : 'Refresh reading failures'}</button>
    </div>
    <p className="mt-2 text-sm text-gray-600">These pages could not be read reliably. Retrying pages wait for the normal schedule; exhausted pages stop automatically. Reading failures do not mean a program is ineligible.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {pages?.length === 0 && <p className="mt-3 text-sm text-gray-600">No current reading failures.</p>}
    {pages && pages.length > 0 && <ul className="mt-4 divide-y divide-gray-200">{pages.map(page => <li key={page.id} className="py-3">
      {safePageUrl(page.selected_official_url)
        ? <a href={safePageUrl(page.selected_official_url)!} target="_blank" rel="noopener noreferrer" className="break-all text-sm font-medium underline">{page.selected_official_url}</a>
        : <p className="break-all text-sm font-medium">{page.selected_official_url || 'Page URL unavailable'}</p>}
      <p className="mt-1 text-sm text-gray-600">Primary source: {page.source_key || 'Unknown source'} · {page.attempt_count} read attempts</p>
      <p className="mt-1 text-sm text-red-700">{page.outcome_reason || 'No failure reason recorded.'}</p>
      <p className="mt-1 text-sm text-gray-600">{page.status === 'FAILED' ? 'Stopped after failures. No automatic retry.' : page.available_at && Number.isFinite(Date.parse(page.available_at))
        ? <>Eligible for retry from <time dateTime={page.available_at}>{new Date(page.available_at).toLocaleString()}</time>. The next scheduled run checks up to three links.</>
        : 'Waiting to retry; retry time unavailable.'}</p>
    </li>)}</ul>}
    {pages?.length === 50 && <p className="mt-3 text-xs text-gray-500">Showing the 50 most recently updated failures.</p>}
  </section>
}
