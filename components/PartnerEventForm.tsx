'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface PartnerEventFormData {
  name: string
  date: string
  description?: string
  link?: string
  organiser?: string
}

interface PartnerEventFormProps {
  initialData?: any
  onSubmit: (data: PartnerEventFormData) => Promise<void>
  onCancel: () => void
  title: string
}

export default function PartnerEventForm({ initialData, onSubmit, onCancel, title }: PartnerEventFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PartnerEventFormData>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        date: initialData.date || '',
        description: initialData.description || '',
        link: initialData.link || '',
        organiser: initialData.organiser || '',
      })
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: PartnerEventFormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          {...register('name', { required: 'Name is required' })}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <input
          type="text"
          id="date"
          {...register('date', { required: 'Date is required' })}
          placeholder="e.g., 2024-01-15 or January 15, 2024"
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
          Link
        </label>
        <input
          type="url"
          id="link"
          {...register('link')}
          placeholder="https://example.com"
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="organiser" className="block text-sm font-medium text-gray-700 mb-1">
          Organiser
        </label>
        <input
          type="text"
          id="organiser"
          {...register('organiser')}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

