'use client'

import { cn } from '@/lib/utils'

interface MultiSelectProps {
  label: string
  options: readonly string[] | string[]
  selected: string[]
  onChange: (values: string[]) => void
  className?: string
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  className,
}: MultiSelectProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border backdrop-blur-sm transition-all',
                isSelected
                  ? 'bg-primary-100/80 border-primary-400/60 text-primary-800 shadow-sm'
                  : 'bg-white/40 border-white/50 text-gray-700 hover:bg-white/60'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MultiSelect
