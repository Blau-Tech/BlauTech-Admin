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
      setCounts(results.map(result => result.count!))
    } catch (err) {
      setCounts(null)
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
    <p className="mt-3 text-xs text-gray-500">A link sent to review may update an existing draft. It does not necessarily create a new program.</p>
  </section>
}
