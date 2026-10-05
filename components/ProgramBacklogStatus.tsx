'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const states = [
  ['QUEUED', 'Waiting to check'],
  ['PROCESSING', 'Checking now'],
  ['RETRY', 'Waiting to retry'],
  ['PENDING_REVIEW', 'Sent to private review'],
  ['FAILED', 'Stopped after failures'],
  ['REJECTED', 'Rejected by ingestion'],
  ['PAUSED', 'Paused — source outside current scope'],
  ['MANUAL_REVIEW', 'Needs a human check'],
] as const

function sourceName(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'search.brave.com') {
      const query = url.searchParams.get('q') || ''
      if (query.includes('student')) return 'Brave · student programs'
      if (query.includes('fellowship')) return 'Brave · fellowships'
      if (query.includes('residency') || query.includes('hacker house')) return 'Brave · residencies'
      return 'Brave search'
    }
    return ({ 'hackermap.org': 'HackerMap', 'alpine-valley.com': 'Alpine Valley', 'runfutureproof.com': 'AcceleratorHub', 'startupquestion.com': 'StartupQuestion' } as Record<string, string>)[host] || host
  } catch { return value }
}

export default function ProgramBacklogStatus() {
  const [counts, setCounts] = useState<number[] | null>(null)
  const [sources, setSources] = useState<Record<string, Record<string, number>> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [capacity, setCapacity] = useState<{ oldest: string | null; completed: number } | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)
  const [upcoming, setUpcoming] = useState<{ url: string; name: string; deadline: string }[] | null>(null)

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.all(states.map(([status]) => supabase
        .from('program_discoveries').select('id', { count: 'exact', head: true })
        .eq('discovery_kind', 'DIRECTORY').eq('status', status)))
      const failed = results.find(result => result.error || result.count === null)
      if (failed) throw new Error(failed.error?.message || 'Queue counts unavailable')
      const sourceResult = await supabase.rpc('program_directory_source_counts')
      if (sourceResult.error) throw new Error(sourceResult.error.message)
      if (!Array.isArray(sourceResult.data)) throw new Error('Source counts unavailable')
      const grouped: Record<string, Record<string, number>> = Object.create(null)
      for (const row of sourceResult.data) {
        if (typeof row.source_url !== 'string' || !row.source_url.trim() || typeof row.status !== 'string' || (typeof row.candidates !== 'number' && (typeof row.candidates !== 'string' || !/^[0-9]+$/.test(row.candidates))) || !Number.isSafeInteger(Number(row.candidates)) || Number(row.candidates) < 0) throw new Error('Invalid source count')
        grouped[row.source_url] ||= Object.create(null)
        grouped[row.source_url][row.status] = Number(row.candidates)
      }
      const since = new Date(Date.now() - 7 * 86400000).toISOString()
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
      const until = new Date(Date.parse(today + 'T00:00:00Z') + 30 * 86400000).toISOString().slice(0, 10)
      const [oldest, completed, deadlines] = await Promise.all([
        supabase.from('program_discoveries').select('available_at')
          .eq('discovery_kind', 'DIRECTORY').eq('status', 'QUEUED')
          .order('available_at', { ascending: true }).limit(1),
        supabase.from('program_discoveries').select('id', { count: 'exact', head: true })
          .eq('discovery_kind', 'DIRECTORY').gte('completed_at', since),
        supabase.from('program_discoveries')
          .select('selected_official_url,name:reader_context->directory_lead->>house_name,deadline:reader_context->directory_lead->>application_deadline_hint')
          .eq('discovery_kind', 'DIRECTORY').eq('status', 'QUEUED').lte('available_at', new Date().toISOString())
          .gte('reader_context->directory_lead->>application_deadline_hint', today)
          .lte('reader_context->directory_lead->>application_deadline_hint', until)
          .order('reader_context->directory_lead->>application_deadline_hint', { ascending: true }).order('available_at', { ascending: true }).order('id', { ascending: true }).limit(3),
      ])
      if (oldest.error || completed.error) throw new Error(oldest.error?.message || completed.error?.message)
      if (!Array.isArray(oldest.data) || oldest.data.length > 1
        || (oldest.data.length === 1 && (typeof oldest.data[0].available_at !== 'string' || !Number.isFinite(Date.parse(oldest.data[0].available_at))))
        || completed.count === null || !Number.isSafeInteger(completed.count) || completed.count < 0) throw new Error('Queue capacity unavailable')
      if (results[0].count! > 0 && oldest.data.length === 0) throw new Error('Queue changed while loading; refresh to try again')
      if (deadlines.error || !Array.isArray(deadlines.data) || deadlines.data.length > 3) throw new Error('Upcoming deadlines unavailable')
      const upcomingRows = deadlines.data.map(row => {
        if (typeof row.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.deadline)
          || !Number.isFinite(Date.parse(row.deadline)) || new Date(row.deadline).toISOString().slice(0, 10) !== row.deadline
          || row.deadline < today || row.deadline > until || typeof row.selected_official_url !== 'string') throw new Error('Invalid deadline hint')
        const url = new URL(row.selected_official_url)
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid program link')
        return { url: url.href, name: typeof row.name === 'string' && row.name.trim() ? row.name : url.hostname, deadline: row.deadline }
      })
      setUpcoming(upcomingRows)
      setCapacity({ oldest: oldest.data[0]?.available_at || null, completed: completed.count })
      setSources(grouped)
      setCounts(results.map(result => result.count!))
      setRefreshedAt(new Date().toISOString())
    } catch (err) {
      setCounts(null)
      setSources(null)
      setCapacity(null)
      setUpcoming(null)
      setRefreshedAt(null)
      setError(err instanceof Error ? err.message : 'Unable to load queue status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  return <section aria-labelledby="program-backlog-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="program-backlog-heading" className="text-lg font-semibold text-gray-900">How links become drafts</h2>
      <button type="button" onClick={refresh} disabled={loading} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">
        {loading ? 'Loading queue…' : 'Refresh queue'}
      </button>
    </div>
    <p className="mt-1 text-sm text-gray-600">Links are checked twice daily. Publishing requires your approval.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">Queue status unavailable: {error}</p>}
    {counts && <>
      <ol aria-label="Link checking flow" className="mt-5 grid gap-3 sm:grid-cols-3">
        {[[0, '1. Waiting', 'Links to check'], [1, '2. Checking', 'Being read now'], [3, '3. Sent to review', 'Check drafts before publishing']].map(([index, label, hint]) => <li key={String(label)} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-900">{label}</div>
          <div className="my-1 text-3xl font-semibold text-gray-900">{counts[Number(index)]}</div>
          <div className="text-sm text-gray-600">{hint}</div>
        </li>)}
      </ol>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <a href="#program-evidence-heading" className="text-amber-800 underline">{counts[7]} need your help</a>
        <a href="#program-reading-failures" className="text-red-700 underline">{counts[2]} retrying · {counts[4]} stopped</a>
      </div>
      <details className="mt-3 text-sm text-gray-500">
        <summary className="cursor-pointer">Set aside: {counts[6]} paused · {counts[5]} excluded</summary>
        <p className="mt-2">Paused links are outside our current focus. Excluded links did not qualify. Neither is waiting to be read.</p>
      </details>
    </>}
    {capacity && counts && <div className="mt-5 rounded-lg bg-gray-50 p-4">
      {upcoming && upcoming.length > 0 && <div className="mb-4 border-b border-gray-200 pb-4">
        <h3 className="font-medium text-gray-900">Coming up first</h3>
        <p className="mt-1 text-xs text-gray-500">Reported deadlines · still need verification. Retries share the queue.</p>
        <ul className="mt-2 space-y-2">{upcoming.map(row => <li key={row.url} className="flex items-start justify-between gap-4 text-sm">
          <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">{row.name}</a>
          <time dateTime={row.deadline} className="shrink-0 font-medium text-amber-800">{new Date(row.deadline + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'Europe/Berlin', day: 'numeric', month: 'short' })}</time>
        </li>)}</ul>
      </div>}
      <h3 className="font-medium text-gray-900">Checking speed</h3>
      <dl className="mt-3 grid gap-4 sm:grid-cols-3">
        <div><dt className="text-sm text-gray-600">Daily limit</dt><dd className="font-semibold">6 links per day</dd></div>
        <div><dt className="text-sm text-gray-600">Oldest waiting link</dt><dd className="font-semibold">{capacity.oldest
          ? `${Math.max(0, Math.floor((Date.now() - Date.parse(capacity.oldest)) / 3600000))} hours`
          : 'No waiting links'}</dd>{capacity.oldest && <time dateTime={capacity.oldest} className="text-xs text-gray-500">Queued since {new Date(capacity.oldest).toLocaleString()}</time>}</div>
        <div><dt className="text-sm text-gray-600">Finished checks in 7 days</dt><dd className="font-semibold">{capacity.completed}</dd></div>
      </dl>
      {counts[0] > 0 && <p className="mt-3 text-sm text-gray-700">At least {Math.ceil(counts[0] / 6)} scheduled days for the waiting queue; retries and new links may add time.</p>}
    </div>}
    {sources && <div className="mt-5 overflow-x-auto">
      {refreshedAt && <p className="mb-2 text-xs text-gray-500">Counts refreshed <time dateTime={refreshedAt}>{new Date(refreshedAt).toLocaleString()}</time></p>}
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left font-medium">Where the links came from</caption>
        <thead><tr><th scope="col" className="p-2">Source</th><th scope="col" className="p-2">To check</th><th scope="col" className="p-2">For review</th><th scope="col" className="p-2">Needs attention</th></tr></thead>
        <tbody>{Object.entries(sources).map(([url, totals]) => {
          const waiting = (totals.QUEUED || 0) + (totals.PROCESSING || 0)
          const attention = (totals.MANUAL_REVIEW || 0) + (totals.RETRY || 0) + (totals.FAILED || 0)
          return <tr key={url} className="border-t border-gray-200">
            <th scope="row" className="p-2 font-normal">
              <div className="font-medium">{sourceName(url)}</div>
              <details className="mt-1 text-xs text-gray-500">
                <summary className="cursor-pointer">Details</summary>
                <p className="mt-2 max-w-sm break-all">{url}</p>
                <p>{totals.QUEUED || 0} waiting · {totals.PROCESSING || 0} checking</p>
                <p>{totals.MANUAL_REVIEW || 0} need a human check · {totals.RETRY || 0} retrying · {totals.FAILED || 0} stopped</p>
                <p>{totals.REJECTED || 0} excluded · {totals.PAUSED || 0} paused</p>
                {(totals.DUPLICATE || 0) > 0 && <p>{totals.DUPLICATE} duplicates</p>}
                {(totals.PUBLISHED || 0) > 0 && <p>{totals.PUBLISHED} published receipts</p>}
              </details>
            </th>
            <td className="p-2 tabular-nums">{waiting}</td>
            <td className="p-2 tabular-nums">{totals.PENDING_REVIEW || 0}</td>
            <td className="p-2">
              {attention > 0 ? <div className="text-amber-800">
                <div className="font-medium">{attention} links</div>
                {(totals.MANUAL_REVIEW || 0) > 0 && <a href="#program-evidence-heading" className="block underline">Human check</a>}
                {(totals.RETRY || 0) + (totals.FAILED || 0) > 0 && <a href="#program-reading-failures" className="block underline">Reading issue</a>}
              </div> : <span className="text-gray-500">None</span>}
            </td>
          </tr>
        })}</tbody>
      </table>
      {Object.keys(sources).length === 0 && <p className="mt-2 text-sm text-gray-600">No directory candidates have been recorded.</p>}
    </div>}
    <details className="mt-3 text-xs text-gray-500">
      <summary className="cursor-pointer font-medium">How the queue works</summary>
      <p className="mt-2 text-xs text-gray-500">The limit is three reads per run at 10:15 and 18:15 Europe/Berlin. Manual runs can add reads. Completed links count current review handoffs or terminal outcomes dated within seven days; retry attempts are not included. This is not a completion forecast.</p>
      <p className="mt-2 text-xs text-gray-500">This is a snapshot of saved candidates, not source uptime or a success rate. Sources with no saved candidates do not appear. Rejections can be correct scope exclusions. Repeated attempts are not counted separately.</p>
      <p className="mt-3 text-xs text-gray-500">Paused links are kept for later review and are not read automatically. Each link is counted under its primary source, even if rediscovered elsewhere. Review handoffs are not a quality score. A link sent to review may update an existing draft. It does not necessarily create a new program.</p>
    </details>
  </section>
}
