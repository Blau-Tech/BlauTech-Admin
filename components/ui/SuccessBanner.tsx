'use client'

import { cn } from '@/lib/utils'

interface SuccessBannerProps {
  message: string
  className?: string
}

export function SuccessBanner({ message, className }: SuccessBannerProps) {
  if (!message) return null

  return (
    <div
      className={cn(
        'rounded-2xl bg-green-50/70 backdrop-blur-md border border-green-200/60 p-4 shadow-sm',
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default SuccessBanner
