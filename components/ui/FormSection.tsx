'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  children: React.ReactNode
  className?: string
  /** When true, removes the top border/padding (use for the first section in a form) */
  first?: boolean
}

export function FormSection({ title, children, className, first = false }: FormSectionProps) {
  return (
    <div
      className={cn(
        'space-y-4',
        !first && 'pt-4 border-t border-white/40',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 border-b border-white/40 pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default FormSection
