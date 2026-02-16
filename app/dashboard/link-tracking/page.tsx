'use client'

import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import { linkTrackingApi } from '@/lib/api'

interface ClicksByPlatform {
  platform: string
  item_type: string
  clicks: number
}

interface ClicksByItem {
  item_type: string
  item_id: string
  platform: string
  destination_url: string
  clicks: number
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  whatsapp: { label: 'WhatsApp', color: 'text-green-800', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  linkedin: { label: 'LinkedIn', color: 'text-blue-800', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  newsletter: { label: 'Newsletter', color: 'text-purple-800', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  telegram: { label: 'Telegram', color: 'text-sky-800', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
}

const ITEM_TYPE_CONFIG: Record<string, { label: string; pluralLabel: string; gradient: string }> = {
  event: { label: 'Event', pluralLabel: 'Events', gradient: 'from-blue-500 to-blue-600' },
  hackathon: { label: 'Hackathon', pluralLabel: 'Hackathons', gradient: 'from-green-500 to-green-600' },
  scholarship: { label: 'Scholarship', pluralLabel: 'Scholarships', gradient: 'from-purple-500 to-purple-600' },
}

export default function LinkTrackingPage() {
  const [clicksByPlatform, setClicksByPlatform] = useState<ClicksByPlatform[]>([])
  const [clicksByItem, setClicksByItem] = useState<ClicksByItem[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [platformData, itemData, total] = await Promise.all([
        linkTrackingApi.fetchClicksByPlatform(),
        linkTrackingApi.fetchClicksByItem(),
        linkTrackingApi.fetchTotalClicks(),
      ])
      setClicksByPlatform(platformData)
      setClicksByItem(itemData)
      setTotalClicks(total)
    } catch (err: any) {
      console.error('Error loading link tracking data:', err)
      setError(err.message || 'Failed to load link tracking data')
    } finally {
      setLoading(false)
    }
  }

  // Aggregate clicks by platform (across all item types)
  const platformTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    clicksByPlatform.forEach((row) => {
      totals[row.platform] = (totals[row.platform] || 0) + row.clicks
    })
    return Object.entries(totals)
      .map(([platform, clicks]) => ({ platform, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
  }, [clicksByPlatform])

  // Aggregate clicks by item type
  const typeTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    clicksByPlatform.forEach((row) => {
      totals[row.item_type] = (totals[row.item_type] || 0) + row.clicks
    })
    return Object.entries(totals)
      .map(([item_type, clicks]) => ({ item_type, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
  }, [clicksByPlatform])

  // Group items for the detail table: group by (item_type, item_id) with per-platform breakdown
  const groupedItems = useMemo(() => {
    const map = new Map<string, {
      item_type: string
      item_id: string
      destination_url: string
      platforms: Record<string, number>
      total: number
    }>()

    clicksByItem.forEach((row) => {
      const key = `${row.item_type}-${row.item_id}`
      if (!map.has(key)) {
        map.set(key, {
          item_type: row.item_type,
          item_id: row.item_id,
          destination_url: row.destination_url,
          platforms: {},
          total: 0,
        })
      }
      const entry = map.get(key)!
      entry.platforms[row.platform] = (entry.platforms[row.platform] || 0) + row.clicks
      entry.total += row.clicks
    })

    let items = Array.from(map.values()).sort((a, b) => b.total - a.total)

    if (filterType !== 'all') {
      items = items.filter((item) => item.item_type === filterType)
    }
    if (filterPlatform !== 'all') {
      items = items.filter((item) => item.platforms[filterPlatform])
    }

    return items
  }, [clicksByItem, filterType, filterPlatform])

  // All platforms present in the data
  const allPlatforms = useMemo(() => {
    const set = new Set<string>()
    clicksByItem.forEach((row) => set.add(row.platform))
    return Array.from(set).sort()
  }, [clicksByItem])

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Link Tracking</h1>
          <p className="text-gray-600">
            See where your users come from — click analytics for events, hackathons, and scholarships across all platforms.
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Clicks Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border-2 border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Clicks</p>
                <p className="text-4xl font-bold text-gray-900">{totalClicks}</p>
                <p className="text-sm text-gray-500 mt-2">All time</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
          </div>

          {/* Per-Platform Cards */}
          {platformTotals.map(({ platform, clicks }) => {
            const config = PLATFORM_CONFIG[platform] || { label: platform, color: 'text-gray-800', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
            return (
              <div key={platform} className={`rounded-2xl p-6 shadow-sm border-2 ${config.bgColor} ${config.borderColor}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{config.label}</p>
                    <p className={`text-4xl font-bold ${config.color}`}>{clicks}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {totalClicks > 0 ? `${Math.round((clicks / totalClicks) * 100)}% of total` : 'No clicks yet'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Clicks by Item Type */}
        {typeTotals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">By Category</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {typeTotals.map(({ item_type, clicks }) => {
                const config = ITEM_TYPE_CONFIG[item_type] || { label: item_type, pluralLabel: item_type, gradient: 'from-gray-500 to-gray-600' }
                return (
                  <div key={item_type} className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${config.gradient}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{config.pluralLabel}</p>
                        <p className="text-2xl font-bold text-gray-900">{clicks} clicks</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Detailed Table */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Per-Item Breakdown</h2>
            <div className="flex items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All types</option>
                {Object.entries(ITEM_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.pluralLabel}</option>
                ))}
              </select>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All platforms</option>
                {allPlatforms.map((p) => (
                  <option key={p} value={p}>{PLATFORM_CONFIG[p]?.label || p}</option>
                ))}
              </select>
            </div>
          </div>

          {groupedItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-gray-500">No click data yet. Clicks will appear here once users start clicking tracked links.</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-xl bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Destination</th>
                      {allPlatforms.map((p) => (
                        <th key={p} className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                          {PLATFORM_CONFIG[p]?.label || p}
                        </th>
                      ))}
                      <th className="px-3 py-3.5 pr-6 text-center text-sm font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groupedItems.map((item) => {
                      const typeConfig = ITEM_TYPE_CONFIG[item.item_type] || { label: item.item_type, gradient: 'from-gray-500 to-gray-600' }
                      return (
                        <tr key={`${item.item_type}-${item.item_id}`} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 pl-6 pr-3 text-sm">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${typeConfig.gradient} text-white`}>
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-600 font-mono">
                            {item.item_id}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <a
                              href={item.destination_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1 max-w-xs truncate"
                              title={item.destination_url}
                            >
                              {(() => {
                                try {
                                  return new URL(item.destination_url).hostname
                                } catch {
                                  return item.destination_url
                                }
                              })()}
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </td>
                          {allPlatforms.map((p) => {
                            const clicks = item.platforms[p] || 0
                            return (
                              <td key={p} className="px-3 py-4 text-sm text-center">
                                {clicks > 0 ? (
                                  <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${PLATFORM_CONFIG[p]?.bgColor || 'bg-gray-100'} ${PLATFORM_CONFIG[p]?.color || 'text-gray-800'}`}>
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
