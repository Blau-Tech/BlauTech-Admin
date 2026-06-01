'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type BadgeColor =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'gray'
  | 'purple'
  | 'pink'
  | 'indigo'
  | 'amber'
  | 'orange'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
  size?: 'sm' | 'md'
}

const colorClass: Record<BadgeColor, string> = {
  blue: 'bg-blue-100/80 text-blue-800 ring-blue-200/60',
  green: 'bg-green-100/80 text-green-800 ring-green-200/60',
  yellow: 'bg-yellow-100/80 text-yellow-800 ring-yellow-200/60',
  red: 'bg-red-100/80 text-red-800 ring-red-200/60',
  gray: 'bg-gray-100/80 text-gray-800 ring-gray-200/60',
  purple: 'bg-purple-100/80 text-purple-800 ring-purple-200/60',
  pink: 'bg-pink-100/80 text-pink-800 ring-pink-200/60',
  indigo: 'bg-indigo-100/80 text-indigo-800 ring-indigo-200/60',
  amber: 'bg-amber-100/80 text-amber-800 ring-amber-200/60',
  orange: 'bg-orange-100/80 text-orange-800 ring-orange-200/60',
}

const sizeClass: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
}

export function Badge({
  color = 'gray',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset backdrop-blur-sm',
        colorClass[color],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
