'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  centered?: boolean
}

const sizeClass: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-b-2',
  lg: 'h-12 w-12 border-b-2',
}

export function LoadingSpinner({
  label,
  size = 'md',
  className,
  centered = true,
}: LoadingSpinnerProps) {
  return (
    <div className={cn(centered && 'text-center py-12', className)}>
      <div
        className={cn(
          'inline-block animate-spin rounded-full border-primary-600',
          sizeClass[size]
        )}
      />
      {label && <p className="mt-4 text-gray-500">{label}</p>}
    </div>
  )
}

export default LoadingSpinner
