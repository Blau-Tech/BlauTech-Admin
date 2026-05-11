'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const baseControl =
  'mt-1 block w-full rounded-xl glass-input text-gray-900 placeholder-gray-500 sm:text-sm px-4 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500'

interface FieldShellProps {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FieldShell({ label, htmlFor, error, hint, required, className, children }: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && ' *'}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    return (
      <FieldShell label={label} htmlFor={id} error={error} hint={hint} required={required}>
        <input
          ref={ref}
          id={id}
          required={required}
          className={cn(baseControl, className)}
          {...props}
        />
      </FieldShell>
    )
  }
)
TextField.displayName = 'TextField'

export interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, className, id, rows = 4, ...props }, ref) => {
    return (
      <FieldShell label={label} htmlFor={id} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          className={cn(baseControl, className)}
          {...props}
        />
      </FieldShell>
    )
  }
)
TextareaField.displayName = 'TextareaField'

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, className, id, children, ...props }, ref) => {
    return (
      <FieldShell label={label} htmlFor={id} error={error} hint={hint} required={required}>
        <select
          ref={ref}
          id={id}
          required={required}
          className={cn(baseControl, className)}
          {...props}
        >
          {children}
        </select>
      </FieldShell>
    )
  }
)
SelectField.displayName = 'SelectField'

interface CheckboxFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, id, className, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn(
            'h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded',
            className
          )}
          {...props}
        />
        <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
          {label}
        </label>
      </div>
    )
  }
)
CheckboxField.displayName = 'CheckboxField'
