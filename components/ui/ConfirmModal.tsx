'use client'

import { ADMIN_LINKEDIN_CITIES, type CityCode } from '@/lib/authorization'

export interface ConfirmModalPreviewItem {
  id?: string
  name: string
  start_date?: string | null
  city?: string | null
}

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  checklist: string[]
  info?: string
  previewItems?: ConfirmModalPreviewItem[]
  previewLabel?: string
  city?: CityCode | null
  onCityChange?: (city: CityCode | null) => void
  onConfirm: (testMode: boolean) => void
  onCancel: () => void
}

function formatPreviewDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ConfirmModal({
  isOpen,
  title,
  checklist,
  info,
  previewItems,
  previewLabel,
  city,
  onCityChange,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const cityRequired = city !== undefined || onCityChange !== undefined

  return (
    <div className="relative z-50" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-strong relative w-full max-w-md overflow-hidden rounded-3xl shadow-xl">
          {/* Amber accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

          <div className="p-7">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-5">Make sure you've done the following <span className="font-bold text-gray-700">before</span> triggering the workflow.</p>

            {cityRequired && (
              <div className="mb-5">
                <label htmlFor="workflow-city" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  City
                </label>
                {onCityChange ? (
                  <select
                    id="workflow-city"
                    value={city ?? ''}
                    onChange={(event) => onCityChange(event.target.value ? (event.target.value as CityCode) : null)}
                    className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500"
                  >
                    <option value="">Select city…</option>
                    {ADMIN_LINKEDIN_CITIES.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0) + option.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl glass-input px-4 py-2.5 text-sm text-gray-700">
                    {city ? city.charAt(0) + city.slice(1).toLowerCase() : 'Not assigned'}
                  </div>
                )}
              </div>
            )}

            {/* Checklist — primary focus */}
            <ul className="mb-4 space-y-2">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">{item}</span>
                </li>
              ))}
            </ul>

            {/* How it works */}
            {info && (
              <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/80 border border-blue-100 px-4 py-3 mb-5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700">{info}</p>
              </div>
            )}

            {/* Event preview */}
            {previewItems !== undefined && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {previewLabel ?? 'Items to be included'}
                </p>
                {previewItems.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p className="text-sm text-red-600">No qualifying items found. Make sure events are highlighted and not yet posted.</p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {previewItems.map((item, i) => (
                      <li key={item.id ?? i} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.city && (
                            <span className="text-xs text-gray-400 font-medium">{item.city}</span>
                          )}
                          {item.start_date && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-lg px-2 py-0.5">
                              {formatPreviewDate(item.start_date)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Run mode note */}
            <p className="text-xs text-gray-400 mb-6">
              Test run saves a preview in n8n execution history without publishing or marking items as posted. Run live performs the real workflow.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-white/50 transition-all"
              >
                Not yet, go back
              </button>
              <button
                type="button"
                onClick={() => { onConfirm(true); onCancel() }}
                disabled={cityRequired && !city}
                className="rounded-xl border border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                Test run
              </button>
              <button
                type="button"
                onClick={() => { onConfirm(false); onCancel() }}
                disabled={cityRequired && !city}
                className="rounded-xl bg-primary-600/90 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                Run live
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
