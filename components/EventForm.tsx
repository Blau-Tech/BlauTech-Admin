'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface EventFormData {
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
}

interface EventFormProps {
  initialData?: any
  onSubmit: (data: EventFormData) => Promise<void>
  onCancel: () => void
  title: string
}

export default function EventForm({ initialData, onSubmit, onCancel, title }: EventFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EventFormData>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '',
        location: initialData.location || '',
      })
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: EventFormData) => {
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title', { required: 'Title is required' })}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
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
        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
          Start Date *
        </label>
        <input
          type="datetime-local"
          id="start_date"
          {...register('start_date', { required: 'Start date is required' })}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
        {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
      </div>

      <div>
        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
          End Date *
        </label>
        <input
          type="datetime-local"
          id="end_date"
          {...register('end_date', { required: 'End date is required' })}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
        />
        {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          {...register('location')}
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

