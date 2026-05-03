'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCityScope } from '@/lib/cityScope'

interface HackathonFormData {
  name: string
  description?: string
  start_date: string
  start_time?: string
  end_date?: string
  end_time?: string
  prizes?: string
  signup_deadline?: string
  organisers?: string
  location?: string
  link?: string
  posted_linkedin?: boolean
  posted_whatsapp?: boolean
  posted_newsletter?: boolean
  is_highlight?: boolean
}

interface HackathonFormProps {
  initialData?: any
  onSubmit: (data: HackathonFormData) => Promise<void>
  onCancel: () => void
  title: string
}

export default function HackathonForm({ initialData, onSubmit, onCancel, title }: HackathonFormProps) {
  const { selectedCity } = useCityScope()
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<HackathonFormData>({
    mode: 'onChange',
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (initialData) {
      const startDate = initialData.start_date ? new Date(initialData.start_date) : null
      const endDate = initialData.end_date ? new Date(initialData.end_date) : null
      const signupDeadline = initialData.signup_deadline ? new Date(initialData.signup_deadline) : null

      let startTime = initialData.start_time || ''
      if (!startTime && startDate) {
        const hours = startDate.getHours().toString().padStart(2, '0')
        const minutes = startDate.getMinutes().toString().padStart(2, '0')
        startTime = `${hours}:${minutes}`
      }

      let endTime = initialData.end_time || ''

      reset({
        name: initialData.name || initialData.title || '',
        description: initialData.description || '',
        start_date: startDate ? startDate.toISOString().slice(0, 10) : '',
        start_time: startTime,
        end_date: endDate ? endDate.toISOString().slice(0, 10) : '',
        end_time: endTime,
        prizes: initialData.prizes || '',
        signup_deadline: signupDeadline ? signupDeadline.toISOString().slice(0, 10) : '',
        organisers: initialData.organisers || initialData.organizer_name || '',
        location: initialData.location || '',
        link: initialData.link || initialData.registration_url || '',
        posted_linkedin: initialData.posted_linkedin || false,
        posted_whatsapp: initialData.posted_whatsapp || false,
        posted_newsletter: initialData.posted_newsletter || false,
        is_highlight: initialData.is_highlight || false,
      })
    } else {
      reset({
        posted_linkedin: false,
        posted_whatsapp: false,
        posted_newsletter: false,
        is_highlight: false,
      })
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: HackathonFormData) => {
    setFormError('')
    setLoading(true)

    try {
      if (data.link && data.link.trim()) {
        try {
          new URL(data.link)
        } catch {
          setFormError('Please enter a valid URL (e.g., https://example.com)')
          setLoading(false)
          return
        }
      }

      let processedData: any = { ...data }

      // Hackathons may be national (city_id null). Edit preserves; new hackathons get the active city by default.
      if (initialData) {
        processedData.city_id = initialData.city_id ?? null
      } else {
        processedData.city_id = selectedCity?.id ?? null
      }

      if (data.start_date) {
        processedData.start_date = new Date(data.start_date).toISOString().split('T')[0]
      }

      if (data.start_time) {
        const timeParts = data.start_time.split(':')
        if (timeParts.length === 2) {
          processedData.start_time = `${data.start_time}:00`
        }
      }

      if (data.end_date) {
        processedData.end_date = new Date(data.end_date).toISOString().split('T')[0]
      } else {
        processedData.end_date = null
      }

      if (data.end_time) {
        const timeParts = data.end_time.split(':')
        if (timeParts.length === 2) {
          processedData.end_time = `${data.end_time}:00`
        }
      } else {
        processedData.end_time = null
      }

      if (data.signup_deadline) {
        processedData.signup_deadline = new Date(data.signup_deadline).toISOString().split('T')[0]
      } else {
        processedData.signup_deadline = null
      }

      if (!data.prizes?.trim()) {
        processedData.prizes = null
      }

      await onSubmit(processedData)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the hackathon. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
      {/* Error Message */}
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

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

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
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            placeholder="Hackathon description"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
        </div>
      </div>

      {/* Hackathon Details */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Hackathon Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="start_date"
              {...register('start_date', { required: 'Start date is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
            />
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
          </div>

          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              id="start_time"
              {...register('start_time')}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              {...register('end_date')}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              id="end_time"
              {...register('end_time')}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup_deadline" className="block text-sm font-medium text-gray-700 mb-1">
            Signup Deadline
          </label>
          <input
            type="date"
            id="signup_deadline"
            {...register('signup_deadline')}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
        </div>

        <div>
          <label htmlFor="prizes" className="block text-sm font-medium text-gray-700 mb-1">
            Prizes
          </label>
          <textarea
            id="prizes"
            rows={2}
            {...register('prizes')}
            placeholder="e.g. $10,000 grand prize, $5,000 runner-up"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            {...register('location')}
            placeholder="Address or venue name"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
        </div>

        <div>
          <label htmlFor="organisers" className="block text-sm font-medium text-gray-700 mb-1">
            Organisers
          </label>
          <input
            type="text"
            id="organisers"
            {...register('organisers')}
            placeholder="Hackathon organisers"
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
            {...register('link', {
              validate: (value) => {
                if (!value) return true
                try {
                  new URL(value)
                  return true
                } catch {
                  return 'Please enter a valid URL (e.g., https://example.com)'
                }
              }
            })}
            placeholder="https://example.com/hackathon"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
          {errors.link && <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>}
        </div>
      </div>

      {/* Social Media & Highlight */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Social Media & Highlight</h3>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="posted_linkedin"
              {...register('posted_linkedin')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="posted_linkedin" className="ml-2 block text-sm text-gray-700">
              Posted on LinkedIn
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="posted_whatsapp"
              {...register('posted_whatsapp')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="posted_whatsapp" className="ml-2 block text-sm text-gray-700">
              Posted on WhatsApp
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="posted_newsletter"
              {...register('posted_newsletter')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="posted_newsletter" className="ml-2 block text-sm text-gray-700">
              Posted in Newsletter
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_highlight"
              {...register('is_highlight')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_highlight" className="ml-2 block text-sm text-gray-700">
              Highlight Hackathon
            </label>
          </div>
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
