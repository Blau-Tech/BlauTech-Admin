'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('sm:flex sm:items-center sm:justify-between mb-6 gap-4', className)}>
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="mt-4 sm:mt-0 flex items-center gap-3 flex-wrap">{actions}</div>
      )}
    </div>
  )
}

export default PageHeader
