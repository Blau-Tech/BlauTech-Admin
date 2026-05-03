'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCityScope } from '@/lib/cityScope'

const UNIVERSITY_OPTIONS = [
  'TUM',
  'LMU',
  'HM',
  'THI',
  'FAU',
  'Uni Augsburg',
  'Uni Bayreuth',
  'Uni Regensburg',
  'Uni Würzburg',
  'Uni Passau',
]

const TOPIC_OPTIONS = [
  'AI',
  'Business',
  'Robotics',
  'Software',
  'Legal',
  'Data Science',
  'Product',
  'Design',
  'Cybersecurity',
  'Finance',
  'Blockchain',
]

interface StudentClubFormData {
  name: string
  description: string
  link: string
  universities?: string[]
  topics?: string[]
}

interface StudentClubFormProps {
  initialData?: any
  onSubmit: (data: {
    name: string
    description: string
    link: string
    universities: string[] | null
    topics: string[] | null
    city_id: number
  }) => Promise<void>
  onCancel: () => void
  title: string
}

export default function StudentClubForm({ initialData, onSubmit, onCancel, title }: StudentClubFormProps) {
  const { selectedCity } = useCityScope()
  const { register, handleSubmit, formState: { errors }, reset } = useForm<StudentClubFormData>({
    mode: 'onChange',
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        link: initialData.link || '',
        universities: Array.isArray(initialData.universities) ? initialData.universities : [],
        topics: Array.isArray(initialData.topics) ? initialData.topics : [],
      })
    } else {
      reset({
        name: '',
        description: '',
        link: '',
        universities: [],
        topics: [],
      })
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: StudentClubFormData) => {
    setFormError('')
    setLoading(true)

    try {
      // Validate URL
      try {
        new URL(data.link)
      } catch {
        setFormError('Please enter a valid URL (e.g., https://example.com)')
        setLoading(false)
        return
      }

      const universitiesArr = Array.from(new Set((data.universities || []).filter(Boolean)))
      const topicsArr = Array.from(new Set((data.topics || []).filter(Boolean)))

      const cityId = initialData?.city_id ?? selectedCity?.id
      if (!cityId) {
        setFormError('No active city selected. Pick a city in the navbar first.')
        setLoading(false)
        return
      }

      await onSubmit({
        name: data.name.trim(),
        description: data.description.trim(),
        link: data.link.trim(),
        universities: universitiesArr.length ? universitiesArr : null,
        topics: topicsArr.length ? topicsArr : null,
        city_id: cityId,
      })
    } catch (err: any) {
      console.error('Student club form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the club. Please try again.')
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
              <div className="mt-2 text-sm text-red-700">
                <p>{formError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{title}</h3>

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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description', { required: 'Description is required' })}
            placeholder="What is this student club about?"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
            Link *
          </label>
          <input
            type="url"
            id="link"
            {...register('link', {
              required: 'Link is required',
              validate: (value) => {
                try {
                  new URL(value)
                  return true
                } catch {
                  return 'Please enter a valid URL (e.g., https://example.com)'
                }
              },
            })}
            placeholder="https://example.com"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
          {errors.link && <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">Universities</div>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-white p-3">
              {UNIVERSITY_OPTIONS.map((u) => (
                <label key={u} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    value={u}
                    {...register('universities')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>{u}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Select all universities this club is associated with.</p>
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">Topics</div>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-white p-3">
              {TOPIC_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    value={t}
                    {...register('topics')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Pick topics to keep filtering consistent.</p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <p className="text-sm text-gray-600">
            Missing an option? Add it to <code className="font-mono text-xs">UNIVERSITY_OPTIONS</code> /{' '}
            <code className="font-mono text-xs">TOPIC_OPTIONS</code> to keep values consistent.
          </p>
        </div>
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

