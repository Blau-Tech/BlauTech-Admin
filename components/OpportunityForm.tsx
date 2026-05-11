'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

type OpportunityType = 'PROGRAM' | 'FELLOWSHIP'
type CityName = 'MUNICH' | 'BERLIN' | 'MADRID'

const CITY_OPTIONS: CityName[] = ['MUNICH', 'BERLIN', 'MADRID']

interface OpportunityFormData {
  opportunity_type: OpportunityType
  title: string
  organisation: string
  description: string
  url: string
  deadline?: string
  posted_linkedin?: boolean
  posted_whatsapp?: boolean
  posted_newsletter?: boolean
  is_highlight?: boolean
}

interface OpportunityFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  title: string
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selected.includes(option)
                ? 'bg-primary-100 border-primary-400 text-primary-800'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function OpportunityForm({ initialData, onSubmit, onCancel }: OpportunityFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<OpportunityFormData>({
    mode: 'onChange',
  })

  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      reset({
        opportunity_type: (initialData.opportunity_type as OpportunityType) || 'PROGRAM',
        title: initialData.title || '',
        organisation: initialData.organisation || '',
        description: initialData.description || '',
        url: initialData.url || '',
        deadline: initialData.deadline || '',
        posted_linkedin: initialData.posted_linkedin || false,
        posted_whatsapp: initialData.posted_whatsapp || false,
        posted_newsletter: initialData.posted_newsletter || false,
        is_highlight: initialData.is_highlight || false,
      })
      setCities(Array.isArray(initialData.cities) ? initialData.cities : [])
    } else {
      reset({
        opportunity_type: 'PROGRAM',
        title: '',
        organisation: '',
        description: '',
        url: '',
        deadline: '',
        posted_linkedin: false,
        posted_whatsapp: false,
        posted_newsletter: false,
        is_highlight: false,
      })
      setCities([])
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: OpportunityFormData) => {
    setFormError('')
    setLoading(true)

    try {
      if (data.url?.trim()) {
        try { new URL(data.url) } catch {
          setFormError('Please enter a valid URL (e.g., https://example.com)')
          setLoading(false)
          return
        }
      }

      const payload: any = {
        opportunity_type: data.opportunity_type,
        title: data.title.trim(),
        organisation: data.organisation.trim(),
        description: data.description.trim(),
        url: data.url.trim(),
        deadline: data.deadline?.trim() ? data.deadline : null,
        cities,
        posted_linkedin: !!data.posted_linkedin,
        posted_whatsapp: !!data.posted_whatsapp,
        posted_newsletter: !!data.posted_newsletter,
        is_highlight: !!data.is_highlight,
      }

      await onSubmit(payload)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the opportunity. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700"><p>{formError}</p></div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

        <div>
          <label htmlFor="opportunity_type" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select id="opportunity_type" {...register('opportunity_type', { required: 'Type is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5">
            <option value="PROGRAM">Program</option>
            <option value="FELLOWSHIP">Fellowship</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" id="title" {...register('title', { required: 'Title is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="organisation" className="block text-sm font-medium text-gray-700 mb-1">Organisation *</label>
          <input type="text" id="organisation" {...register('organisation', { required: 'Organisation is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.organisation && <p className="mt-1 text-sm text-red-600">{errors.organisation.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea id="description" rows={4} {...register('description', { required: 'Description is required' })}
            placeholder="Opportunity description"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input type="url" id="url" {...register('url', { required: 'URL is required' })} placeholder="https://example.com/opportunity"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>}
          </div>
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input type="date" id="deadline" {...register('deadline')}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          </div>
        </div>

        <MultiSelect label="Cities" options={CITY_OPTIONS} selected={cities} onChange={setCities} />
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Publishing</h3>
        <div className="space-y-3">
          {[
            { id: 'posted_linkedin', label: 'Posted on LinkedIn' },
            { id: 'posted_whatsapp', label: 'Posted on WhatsApp' },
            { id: 'posted_newsletter', label: 'Posted in Newsletter' },
            { id: 'is_highlight', label: 'Highlight Opportunity' },
          ].map((item) => (
            <div key={item.id} className="flex items-center">
              <input type="checkbox" id={item.id} {...register(item.id as any)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
              <label htmlFor={item.id} className="ml-2 block text-sm text-gray-700">{item.label}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
