'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { triggerWorkflow } from '@/lib/api'
import { canonicalizeLinkedInPostUrl } from '@/lib/linkedinDiscovery'

type Candidate = {
  id: string
  url: string
  canonical_url: string
  title: string | null
  discovered_at: string
}

type Run = {
  status: 'running' | 'completed' | 'failed'
  result_count: number | null
  error: string | null
  started_at: string
}

export default function LinkedInCandidatePosts({ event }: { event: any }) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [lastRun, setLastRun] = useState<Run | null>(null)
  const [manualUrl, setManualUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const [targets, runs] = await Promise.all([
      supabase.from('linkedin_post_targets').select('*').eq('event_id', event.id)
        .order('discovered_at', { ascending: false }),
      supabase.from('linkedin_discovery_runs').select('status,result_count,error,started_at')
        .eq('event_id', event.id).order('started_at', { ascending: false }).limit(1),
    ])
    if (targets.error) throw targets.error
    if (runs.error) throw runs.error
    setCandidates(targets.data || [])
    setLastRun(runs.data?.[0] || null)
  }, [event.id])

  useEffect(() => {
    if (event.city !== 'BERLIN') return
    load().catch((error) => setMessage(error.message))
  }, [event.city, load])

  if (event.city !== 'BERLIN') return null

  const discover = async () => {
    setBusy(true)
    setMessage('')
    try {
      await triggerWorkflow('berlin-linkedin-post-discovery', {
        event_id: event.id,
        city: 'BERLIN',
        test_mode: false,
      })
      setMessage('Discovery started. Refresh this section shortly to see candidates.')
      await load()
    } catch (error: any) {
      setMessage(error.message || 'Discovery failed.')
    } finally {
      setBusy(false)
    }
  }

  const addManual = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const canonicalUrl = canonicalizeLinkedInPostUrl(manualUrl)
      const { error } = await supabase.from('linkedin_post_targets').upsert({
        event_id: event.id,
        url: manualUrl.trim(),
        canonical_url: canonicalUrl,
        discovered_at: new Date().toISOString(),
      }, { onConflict: 'event_id,canonical_url' })
      if (error) throw error
      setManualUrl('')
      setMessage('Candidate saved.')
      await load()
    } catch (error: any) {
      setMessage(error.message || 'Could not save this URL.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Candidate LinkedIn posts</h3>
          <p className="mt-1 text-sm text-gray-600">
            Public search candidates for this Berlin listing. Review them before use.
          </p>
        </div>
        <button onClick={discover} disabled={busy}
          className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
          {busy ? 'Working…' : 'Find LinkedIn posts'}
        </button>
      </div>

      {lastRun && (
        <p className="mt-3 text-xs text-gray-600">
          Last run: {lastRun.status}
          {lastRun.status === 'completed' ? ` · ${lastRun.result_count ?? 0} result(s)` : ''}
          {lastRun.error ? ` · ${lastRun.error}` : ''}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {candidates.map((candidate) => (
          <li key={candidate.id} className="rounded-lg bg-white p-3 text-sm">
            <a href={candidate.canonical_url} target="_blank" rel="noopener noreferrer"
              className="break-all font-medium text-blue-700 hover:underline">
              {candidate.title || candidate.canonical_url}
            </a>
          </li>
        ))}
        {!candidates.length && <li className="text-sm text-gray-500">No candidates saved yet.</li>}
      </ul>

      <form onSubmit={addManual} className="mt-4 flex gap-2">
        <input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)}
          placeholder="https://www.linkedin.com/posts/…"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          required />
        <button disabled={busy} className="rounded-lg border border-blue-700 px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-50">
          Add URL
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </section>
  )
}
