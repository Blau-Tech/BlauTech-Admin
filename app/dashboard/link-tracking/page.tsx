'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import { linkTrackingApi, TrackedLinkWithStats } from '@/lib/api'

type Channel = 'WHATSAPP' | 'LINKEDIN' | 'WEBSITE' | 'NEWSLETTER'

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  WHATSAPP: { label: 'WhatsApp', color: 'text-green-800', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  LINKEDIN: { label: 'LinkedIn', color: 'text-blue-800', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  WEBSITE: { label: 'Website', color: 'text-indigo-800', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  NEWSLETTER: { label: 'Newsletter', color: 'text-purple-800', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
}

const ALL_CHANNELS: Channel[] = ['WHATSAPP', 'LINKEDIN', 'WEBSITE', 'NEWSLETTER']

export default function LinkTrackingPage() {
  const [trackedLinks, setTrackedLinks] = useState<TrackedLinkWithStats[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterChannel, setFilterChannel] = useState<Channel | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<string>('total_desc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [links, total] = await Promise.all([
        linkTrackingApi.fetchTrackedLinks(),
        linkTrackingApi.fetchTotalClicks(),
      ])
      setTrackedLinks(links)
      setTotalClicks(total)
    } catch (err: any) {
      console.error('Error loading link tracking data:', err)
      setError(err.message || 'Failed to load link tracking data')
    } finally {
      setLoading(false)
    }
  }

  // Aggregate clicks by channel
  const channelTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    trackedLinks.forEach((l) => {
      totals[l.channel] = (totals[l.channel] || 0) + l.click_count
    })
    return ALL_CHANNELS
      .filter((c) => totals[c] !== undefined)
      .map((channel) => ({ channel, clicks: totals[channel] || 0 }))
      .sort((a, b) => b.clicks - a.clicks)
  }, [trackedLinks])

  // Aggregate per-event with channel breakdown
  const groupedByEvent = useMemo(() => {
    const map = new Map<string, {
      event_id: string
      event_name: string
      channels: Record<string, number>
      total: number
      created_at: string
    }>()

    trackedLinks.forEach((link) => {
      const key = link.event_id
      if (!map.has(key)) {
        map.set(key, {
          event_id: link.event_id,
          event_name: link.event_name || `Unknown event (${link.event_id.slice(0, 8)})`,
          channels: {},
          total: 0,
          created_at: link.created_at,
        })
      }
      const entry = map.get(key)!
      entry.channels[link.channel] = (entry.channels[link.channel] || 0) + link.click_count
      entry.total += link.click_count
      // Track the newest tracked-link created_at for this event
      if (link.created_at && link.created_at > entry.created_at) {
        entry.created_at = link.created_at
      }
    })

    let items = Array.from(map.values())

    if (filterChannel !== 'ALL') {
      items = items.filter((item) => item.channels[filterChannel])
    }

    switch (sortBy) {
      case 'total_asc':
        items.sort((a, b) => a.total - b.total)
        break
      case 'name_asc':
        items.sort((a, b) => a.event_name.localeCompare(b.event_name))
        break
      case 'name_desc':
        items.sort((a, b) => b.event_name.localeCompare(a.event_name))
        break
      case 'created_asc':
        items.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
        break
      case 'created_desc':
        items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        break
      default:
        items.sort((a, b) => b.total - a.total)
    }

    return items
  }, [trackedLinks, filterChannel, sortBy])

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-500">Loading link tracking data...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Link Tracking</h1>
          <p className="text-gray-600">
            See where your users come from — click analytics for events across all channels.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto pl-3 inline-flex text-red-400 hover:text-red-600">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm border-2 border-gray-100">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Clicks</p>
            <p className="text-4xl font-bold text-gray-900">{totalClicks}</p>
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </div>

          {channelTotals.map(({ channel, clicks }) => {
            const config = CHANNEL_CONFIG[channel as Channel] || { label: channel, color: 'text-gray-800', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
            return (
              <div key={channel} className={`rounded-2xl p-6 shadow-sm border-2 ${config.bgColor} ${config.borderColor}`}>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{config.label}</p>
                <p className={`text-4xl font-bold ${config.color}`}>{clicks}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalClicks > 0 ? `${Math.round((clicks / totalClicks) * 100)}% of total` : 'No clicks yet'}
                </p>
              </div>
            )
          })}
        </div>

        {/* Per-event table */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Per-Event Breakdown</h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-600 font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="total_desc">Total clicks (high first)</option>
                <option value="total_asc">Total clicks (low first)</option>
                <option value="created_desc">Newest links first</option>
                <option value="created_asc">Oldest links first</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value as Channel | 'ALL')}
                className="block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="ALL">All channels</option>
                {ALL_CHANNELS.map((c) => (
                  <option key={c} value={c}>{CHANNEL_CONFIG[c].label}</option>
                ))}
              </select>
            </div>
          </div>

          {groupedByEvent.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-gray-500">No tracked links yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-xl bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Event</th>
                      {ALL_CHANNELS.map((c) => (
                        <th key={c} className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                          {CHANNEL_CONFIG[c].label}
                        </th>
                      ))}
                      <th className="px-3 py-3.5 pr-6 text-center text-sm font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groupedByEvent.map((item) => (
                      <tr key={item.event_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 pl-6 pr-3 text-sm">
                          <div>
                            <p className="font-semibold text-gray-900 truncate max-w-[300px]" title={item.event_name}>
                              {item.event_name}
                            </p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {item.event_id.slice(0, 8)}…</p>
                          </div>
                        </td>
                        {ALL_CHANNELS.map((c) => {
                          const clicks = item.channels[c] || 0
                          const config = CHANNEL_CONFIG[c]
                          return (
                            <td key={c} className="px-3 py-4 text-sm text-center">
                              {clicks > 0 ? (
                                <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                                  {clicks}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-3 py-4 pr-6 text-sm text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-900 text-white">
                            {item.total}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Raw tracked links list */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Tracked Links</h2>
          {trackedLinks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No tracked links yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-xl bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Event</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Channel</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Slug</th>
                      <th className="px-3 py-3.5 pr-6 text-center text-sm font-semibold text-gray-900">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trackedLinks.map((link) => {
                      const config = CHANNEL_CONFIG[link.channel as Channel]
                      return (
                        <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 pl-6 pr-3 text-sm font-medium text-gray-900 truncate max-w-[300px]">
                            {link.event_name || `Event ${link.event_id.slice(0, 8)}…`}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config?.bgColor || 'bg-gray-100'} ${config?.color || 'text-gray-800'}`}>
                              {config?.label || link.channel}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm font-mono text-gray-700">{link.slug}</td>
                          <td className="px-3 py-4 pr-6 text-sm text-center font-semibold text-gray-900">
                            {link.click_count}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
