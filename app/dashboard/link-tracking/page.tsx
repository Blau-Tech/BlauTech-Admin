'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import { linkTrackingApi, TrackedLinkWithStats } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import GlassCard from '@/components/ui/GlassCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBanner from '@/components/ui/ErrorBanner'
import Badge from '@/components/ui/Badge'

type Channel = 'WHATSAPP' | 'LINKEDIN' | 'WEBSITE' | 'NEWSLETTER'

type ChannelBadgeColor = 'green' | 'blue' | 'indigo' | 'purple'

const CHANNEL_CONFIG: Record<Channel, { label: string; badgeColor: ChannelBadgeColor; gradient: string }> = {
  WHATSAPP: { label: 'WhatsApp', badgeColor: 'green', gradient: 'from-green-100/60 to-emerald-100/60' },
  LINKEDIN: { label: 'LinkedIn', badgeColor: 'blue', gradient: 'from-blue-100/60 to-sky-100/60' },
  WEBSITE: { label: 'Website', badgeColor: 'indigo', gradient: 'from-indigo-100/60 to-violet-100/60' },
  NEWSLETTER: { label: 'Newsletter', badgeColor: 'purple', gradient: 'from-purple-100/60 to-fuchsia-100/60' },
}

const ALL_CHANNELS: Channel[] = ['WHATSAPP', 'LINKEDIN', 'WEBSITE', 'NEWSLETTER']

export default function LinkTrackingPage() {
  const { isCityLead, userCity, loading: authLoading } = useAuth()
  const cityFilter = isCityLead ? userCity ?? undefined : undefined
  const [trackedLinks, setTrackedLinks] = useState<TrackedLinkWithStats[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterChannel, setFilterChannel] = useState<Channel | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<string>('total_desc')

  useEffect(() => {
    if (authLoading) return
    loadData()
  }, [authLoading, cityFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [links, total] = await Promise.all([
        linkTrackingApi.fetchTrackedLinks(cityFilter),
        linkTrackingApi.fetchTotalClicks(cityFilter),
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

  // Aggregate clicks by event city (super-admin comparison view only)
  const cityTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    trackedLinks.forEach((l) => {
      const key = l.event_city || 'GLOBAL'
      totals[key] = (totals[key] || 0) + l.click_count
    })
    return Object.entries(totals)
      .map(([city, clicks]) => ({ city, clicks }))
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
        <LoadingSpinner label="Loading link tracking data..." />
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

        {error && <ErrorBanner message={error} onClose={() => setError('')} className="mb-6" />}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <GlassCard className="p-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Clicks</p>
            <p className="text-4xl font-bold text-gray-900">{totalClicks}</p>
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </GlassCard>

          {channelTotals.map(({ channel, clicks }) => {
            const config = CHANNEL_CONFIG[channel as Channel]
            if (!config) {
              return (
                <GlassCard key={channel} className="p-6">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{channel}</p>
                  <p className="text-4xl font-bold text-gray-900">{clicks}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {totalClicks > 0 ? `${Math.round((clicks / totalClicks) * 100)}% of total` : 'No clicks yet'}
                  </p>
                </GlassCard>
              )
            }
            return (
              <div key={channel} className={`rounded-3xl p-6 border border-white/50 backdrop-blur-xl bg-gradient-to-br ${config.gradient} shadow-sm`}>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">{config.label}</p>
                <p className="text-4xl font-bold text-gray-900">{clicks}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalClicks > 0 ? `${Math.round((clicks / totalClicks) * 100)}% of total` : 'No clicks yet'}
                </p>
              </div>
            )
          })}
        </div>

        {/* By City — only meaningful for super-admins (city leads are already scoped) */}
        {!isCityLead && cityTotals.length > 1 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">By City</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cityTotals.map(({ city, clicks }) => {
                const label = city === 'GLOBAL' ? 'Global / Online' : city.charAt(0) + city.slice(1).toLowerCase()
                return (
                  <GlassCard key={city} className="p-5">
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{clicks} clicks</p>
                    {totalClicks > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((clicks / totalClicks) * 100)}% of total
                      </p>
                    )}
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        {/* Per-event table */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Per-Event Breakdown</h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-600 font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block rounded-xl glass-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500"
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
                className="block rounded-xl glass-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500"
              >
                <option value="ALL">All channels</option>
                {ALL_CHANNELS.map((c) => (
                  <option key={c} value={c}>{CHANNEL_CONFIG[c].label}</option>
                ))}
              </select>
            </div>
          </div>

          {groupedByEvent.length === 0 ? (
            <GlassCard className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-gray-500">No tracked links yet.</p>
            </GlassCard>
          ) : (
            <div className="glass overflow-hidden rounded-3xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/40">
                  <thead className="bg-white/30 backdrop-blur-sm">
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
                  <tbody className="divide-y divide-white/40">
                    {groupedByEvent.map((item) => (
                      <tr key={item.event_id} className="hover:bg-white/40 transition-colors">
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
                                <Badge color={config.badgeColor} size="sm">{clicks}</Badge>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-3 py-4 pr-6 text-sm text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-900/90 backdrop-blur-sm text-white">
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
            <GlassCard className="text-center py-12">
              <p className="text-gray-500">No tracked links yet.</p>
            </GlassCard>
          ) : (
            <div className="glass overflow-hidden rounded-3xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/40">
                  <thead className="bg-white/30 backdrop-blur-sm">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Event</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Channel</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Slug</th>
                      <th className="px-3 py-3.5 pr-6 text-center text-sm font-semibold text-gray-900">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {trackedLinks.map((link) => {
                      const config = CHANNEL_CONFIG[link.channel as Channel]
                      return (
                        <tr key={link.id} className="hover:bg-white/40 transition-colors">
                          <td className="py-4 pl-6 pr-3 text-sm font-medium text-gray-900 truncate max-w-[300px]">
                            {link.event_name || `Event ${link.event_id.slice(0, 8)}…`}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            {config ? (
                              <Badge color={config.badgeColor} size="sm">{config.label}</Badge>
                            ) : (
                              <Badge color="gray" size="sm">{link.channel}</Badge>
                            )}
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
