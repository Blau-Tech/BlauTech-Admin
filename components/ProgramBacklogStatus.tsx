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
      setSources(grouped)
      setCounts(results.map(result => result.count!))
    } catch (err) {
      setCounts(null)
      setSources(null)
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
