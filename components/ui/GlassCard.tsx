'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'strong' | 'subtle'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  as?: keyof JSX.IntrinsicElements
}

const variantClass: Record<Variant, string> = {
  default: 'glass',
  strong: 'glass-strong',
  subtle: 'glass-subtle',
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', as: Tag = 'div', children, ...props }, ref) => {
    const Component = Tag as any
    return (
      <Component
        ref={ref}
        className={cn(variantClass[variant], 'rounded-3xl', className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
GlassCard.displayName = 'GlassCard'

export { GlassCard }
export default GlassCard
