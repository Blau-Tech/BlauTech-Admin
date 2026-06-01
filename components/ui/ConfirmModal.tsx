'use client'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  checklist: string[]
  info?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  checklist,
  info,
  confirmLabel = 'Yes, proceed',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

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

            {/* Consequence note */}
            <p className="text-xs text-gray-400 mb-6">
              Re-triggering the workflow won't reuse the same items — it'll just generate a new draft based on whatever is highlighted at that point.
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
                onClick={() => { onConfirm(); onCancel() }}
                className="rounded-xl bg-primary-600/90 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
