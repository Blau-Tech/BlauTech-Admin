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
] as const

export default function ProgramBacklogStatus() {
  const [counts, setCounts] = useState<number[] | null>(null)
  const [sources, setSources] = useState<Record<string, Record<string, number>> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [capacity, setCapacity] = useState<{ oldest: string | null; completed: number } | null>(null)

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
        if (typeof row.source_url !== 'string' || typeof row.status !== 'string' || !Number.isSafeInteger(Number(row.candidates)) || Number(row.candidates) < 0) throw new Error('Invalid source count')
        grouped[row.source_url] ||= Object.create(null)
        grouped[row.source_url][row.status] = Number(row.candidates)
      }
      const since = new Date(Date.now() - 7 * 86400000).toISOString()
      const [oldest, completed] = await Promise.all([
        supabase.from('program_discoveries').select('available_at')
          .eq('discovery_kind', 'DIRECTORY').eq('status', 'QUEUED')
          .order('available_at', { ascending: true }).limit(1),
        supabase.from('program_discoveries').select('id', { count: 'exact', head: true })
          .eq('discovery_kind', 'DIRECTORY').gte('completed_at', since),
      ])
      if (oldest.error || completed.error) throw new Error(oldest.error?.message || completed.error?.message)
      if (!Array.isArray(oldest.data) || oldest.data.length > 1
        || (oldest.data.length === 1 && (typeof oldest.data[0].available_at !== 'string' || !Number.isFinite(Date.parse(oldest.data[0].available_at))))
        || completed.count === null || !Number.isSafeInteger(completed.count) || completed.count < 0) throw new Error('Queue capacity unavailable')
      if (results[0].count! > 0 && oldest.data.length === 0) throw new Error('Queue changed while loading; refresh to try again')
      setCapacity({ oldest: oldest.data[0]?.available_at || null, completed: completed.count })
      setSources(grouped)
      setCounts(results.map(result => result.count!))
    } catch (err) {
      setCounts(null)
      setSources(null)
      setCapacity(null)
      setError(err instanceof Error ? err.message : 'Unable to load queue status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  return <section aria-labelledby="program-backlog-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="program-backlog-heading" className="text-lg font-semibold text-gray-900">Program ingestion queue</h2>
      <button type="button" onClick={refresh} disabled={loading} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">
        {loading ? 'Loading queue…' : 'Refresh queue'}
      </button>
    </div>
    <p className="mt-1 text-sm text-gray-600">Directory links are checked up to three at a time, twice daily. These counts track ingestion; publication still requires admin approval.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">Queue status unavailable: {error}</p>}
    {counts && <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
      {states.map(([status, label], index) => <div key={status}>
        <dt className="text-sm text-gray-600">{label}</dt>
        <dd className="text-xl font-semibold text-gray-900">{counts[index]}</dd>
      </div>)}
    </dl>}
    {capacity && counts && <div className="mt-5 rounded-lg bg-gray-50 p-4">
      <h3 className="font-medium text-gray-900">Processing capacity</h3>
      <dl className="mt-3 grid gap-4 sm:grid-cols-3">
        <div><dt className="text-sm text-gray-600">Scheduled read limit</dt><dd className="font-semibold">6 links per day</dd></div>
        <div><dt className="text-sm text-gray-600">Oldest waiting link</dt><dd className="font-semibold">{capacity.oldest
          ? `${Math.max(0, Math.floor((Date.now() - Date.parse(capacity.oldest)) / 3600000))} hours`
          : 'No waiting links'}</dd>{capacity.oldest && <time dateTime={capacity.oldest} className="text-xs text-gray-500">Queued since {new Date(capacity.oldest).toLocaleString()}</time>}</div>
        <div><dt className="text-sm text-gray-600">Completed links in the last 7 days</dt><dd className="font-semibold">{capacity.completed}</dd></div>
      </dl>
      {counts[0] > 0 && <p className="mt-3 text-sm text-gray-700">The waiting queue alone needs at least {Math.ceil(counts[0] / 6)} scheduled processing days at this limit. Retries and new links can increase the wait.</p>}
      <p className="mt-2 text-xs text-gray-500">The limit is three reads per run at 10:15 and 18:15 Europe/Berlin. Manual runs can add reads. Completed links count current review handoffs or terminal outcomes dated within seven days; retry attempts are not included. This is not a completion forecast.</p>
    </div>}
    {sources && <div className="mt-5 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left font-medium">By primary discovery source</caption>
        <thead><tr><th className="p-2">Source</th><th className="p-2">Waiting</th><th className="p-2">Retry</th><th className="p-2">Sent to review</th><th className="p-2">Stopped</th></tr></thead>
        <tbody>{Object.entries(sources).map(([url, totals]) => <tr key={url} className="border-t border-gray-200">
          <th className="p-2 break-all font-normal">{url}</th>
          <td className="p-2">{totals.QUEUED || 0}</td><td className="p-2">{totals.RETRY || 0}</td>
          <td className="p-2">{totals.PENDING_REVIEW || 0}</td><td className="p-2">{(totals.FAILED || 0) + (totals.REJECTED || 0)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <p className="mt-3 text-xs text-gray-500">Each link is counted under its primary source, even if rediscovered elsewhere. Review handoffs are not a quality score. A link sent to review may update an existing draft. It does not necessarily create a new program.</p>
  </section>
}
