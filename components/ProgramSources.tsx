'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const sources = [
  { key: 'alpine-hacker-houses', name: 'Alpine Valley', url: 'https://www.alpine-valley.com/hacker-houses', cadence: 'Tuesday · 10:00', state: 'Automatic' },
  { key: 'startup-question', name: 'StartupQuestion', url: 'https://www.startupquestion.com/vc-directory', cadence: 'Thursday · 10:00', state: 'Automatic' },
  { key: 'aisafety-training', name: 'AISafety.com', url: 'https://aisafety.com/training', cadence: 'On demand', state: 'Manual' },
  { key: 'devgrants-fellowships', name: 'DevGrants Daily', url: 'https://devgrantsdaily.com/', cadence: 'On demand', state: 'Manual' },
  { key: 'third-door-programs', name: 'Third Door Stories', url: 'https://thirddoorstories.lovable.app/map', cadence: 'On demand', state: 'Manual' },
  { key: 'ai-fellowship-hub', name: 'AI Fellowship Hub', url: 'https://aifellowshiphub.com/opportunities/', cadence: 'On demand', state: 'Manual' },
  { key: 'hackermap', name: 'HackerMap', url: 'https://hackermap.org/', cadence: 'On demand', state: 'Manual' },
  { key: 'nowwhere-startup-houses', name: 'Nowwhere', url: 'https://nowwhere.city/', cadence: 'On demand', state: 'Manual' },
  { key: 'accelerator-hub', name: 'AcceleratorHub', url: 'https://www.runfutureproof.com/acceleratorhub/programs', cadence: 'Outside our current focus', state: 'Paused' },
]

type DirectoryRun = { execution_id: string; source_key: string; status: 'STARTED' | 'SUCCEEDED' | 'FAILED'; started_at: string; finished_at: string | null }

export default function ProgramSources() {
  const [runs, setRuns] = useState<DirectoryRun[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [watch, setWatch] = useState<{ key: string; previousId: string | null; until: number } | null>(null)
  async function refresh() {
    setLoading(true)
    setError(false)
    try {
      const { data, error } = await supabase.from('program_directory_runs').select('execution_id,source_key,status,started_at,finished_at')
      if (error || !Array.isArray(data) || data.some(row => !row
        || typeof row.execution_id !== 'string' || !/^[0-9]{1,30}$/.test(row.execution_id)
        || !sources.some(source => source.key === row.source_key)
        || !['STARTED', 'SUCCEEDED', 'FAILED'].includes(row.status)
        || typeof row.started_at !== 'string' || !Number.isFinite(Date.parse(row.started_at))
        || (row.status === 'STARTED' ? row.finished_at !== null
          : typeof row.finished_at !== 'string' || !Number.isFinite(Date.parse(row.finished_at))))) throw Error('Unavailable')
      setRuns(data as DirectoryRun[])
    } catch { setRuns(null); setError(true) }
    finally { setLoading(false) }
  }
  async function collect(key: string) {
    setRequesting(key)
    setNotice('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw Error('Please sign in again.')
      const response = await fetch(`/api/workflows/program-directory-${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: '{}',
      })
      if (!response.ok) throw Error('Could not start collection. Please try again later.')
      setNotice('Collection requested. Updating automatically…')
      setWatch({ key, previousId: runs?.find(run => run.source_key === key)?.execution_id || null, until: Date.now() + 120000 })
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Collection unavailable.') }
    finally { setRequesting(null) }
  }
  useEffect(() => { void refresh() }, [])
  useEffect(() => {
    if (!watch || loading) return
    const current = runs?.find(run => run.source_key === watch.key)
    if (current && current.execution_id !== watch.previousId && current.status !== 'STARTED') {
      setNotice(`${sources.find(source => source.key === watch.key)?.name} ${current.status === 'FAILED' ? 'check failed. You can try Check now again.' : 'check finished.'}`)
      setWatch(null)
      return
    }
    if (Date.now() >= watch.until) {
      setNotice('Completion not confirmed yet. Use Refresh to check again.')
      setWatch(null)
      return
    }
    const timer = setTimeout(() => { void refresh() }, 5000)
    return () => clearTimeout(timer)
  }, [watch, runs, loading, error])
  function lastRun(key: string) {
    if (!runs) return error ? 'Last check unavailable' : 'Loading last check…'
    const run = runs.find(row => row.source_key === key)
    if (!run) return 'No check recorded yet'
    const date = new Date(run.finished_at || run.started_at).toLocaleString('en-GB', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' })
    return run.status === 'FAILED' ? `Check failed · ${date}` : run.status === 'SUCCEEDED' ? `Directory checked · ${date}` : watch?.key === key && run.execution_id !== watch.previousId ? `Checking · ${date}` : `Started · ${date} · completion not recorded`
  }
  return <section aria-labelledby="program-sources-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex items-center justify-between gap-3"><h2 id="program-sources-heading" className="text-lg font-semibold text-gray-900">Connected directories</h2><button type="button" disabled={loading} onClick={refresh} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button></div>
    <p className="mt-1 text-sm text-gray-600">Check now finds program links. Times are Europe/Berlin.</p>
    <p role="status" className="mt-2 text-sm text-gray-600">{notice}</p>
    <ul className="mt-4 divide-y divide-gray-200">
      {sources.map(source => <li key={source.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 underline">{source.name}</a><p className="text-sm text-gray-600">{source.cadence}</p></div>
        <div className="text-right text-sm"><span className={source.state === 'Automatic' ? 'font-medium text-blue-800' : 'font-medium text-gray-600'}>{source.state}</span><p className={runs?.some(run => run.source_key === source.key && run.status === 'FAILED') ? 'text-xs text-red-700' : 'text-xs text-gray-500'}>{lastRun(source.key)}</p>{source.state !== 'Paused' && <button type="button" disabled={requesting !== null || watch !== null || runs === null} onClick={() => collect(source.key)} className="mt-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">{requesting === source.key ? 'Requesting…' : watch?.key === source.key ? 'Waiting for result…' : 'Check now'}</button>}</div>
      </li>)}
    </ul>
    <p className="mt-3 text-xs text-gray-500">The queue checks each program next. Publishing needs your approval.</p>
  </section>
}
