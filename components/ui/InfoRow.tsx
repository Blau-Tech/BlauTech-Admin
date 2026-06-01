'use client'

import * as React from 'react'

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

export function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/40 last:border-0">
      <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  )
}

export default InfoRow
