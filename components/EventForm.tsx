'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCityScope } from '@/lib/cityScope'

interface EventFormData {
  name: string
  description?: string
  start_date: string
  start_time?: string
  organisers?: string
  location?: string
  format: string
  link?: string
  posted_linkedin?: boolean
  posted_whatsapp?: boolean
  posted_newsletter?: boolean
  is_highlight?: boolean
  partner_event?: boolean
  sponsored_event?: boolean
}

interface EventFormProps {
  initialData?: any
  onSubmit: (data: EventFormData) => Promise<void>
  onCancel: () => void
  title: string
}

export default function EventForm({ initialData, onSubmit, onCancel, title }: EventFormProps) {
  const { selectedCity } = useCityScope()
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<EventFormData>({
    mode: 'onChange',
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (initialData) {
      const startDate = initialData.start_date ? new Date(initialData.start_date) : null
      // Extract time from start_date if it exists, otherwise use start_time field
      let startTime = initialData.start_time || ''
      if (!startTime && startDate) {
        const hours = startDate.getHours().toString().padStart(2, '0')
        const minutes = startDate.getMinutes().toString().padStart(2, '0')
        startTime = `${hours}:${minutes}`
      }
      
      reset({
        name: initialData.name || initialData.title || '',
        description: initialData.description || '',
        start_date: startDate ? startDate.toISOString().slice(0, 10) : '',
        start_time: startTime,
        organisers: initialData.organisers || initialData.organizer_name || '',
        location: initialData.location || '',
        format: initialData.format || 'In-Person',
        link: initialData.link || initialData.registration_url || '',
        posted_linkedin: initialData.posted_linkedin || false,
        posted_whatsapp: initialData.posted_whatsapp || false,
        posted_newsletter: initialData.posted_newsletter || false,
        is_highlight: initialData.is_highlight || false,
        partner_event: initialData.partner_event || false,
        sponsored_event: initialData.sponsored_event || false,
      })
    } else {
      reset({
        format: 'In-Person',
        posted_linkedin: false,
        posted_whatsapp: false,
        posted_newsletter: false,
        is_highlight: false,
        partner_event: false,
        sponsored_event: false,
      })
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: EventFormData) => {
    setFormError('')
    setLoading(true)
    
    try {
      // Validate URL if provided
      if (data.link && data.link.trim()) {
        try {
          new URL(data.link)
        } catch {
          setFormError('Please enter a valid URL (e.g., https://example.com)')
          setLoading(false)
          return
        }
      }
      
      // Process data for submission
      let processedData: any = { ...data }

      // Bind to the active city. Editing keeps the existing city_id; new records get the selected one.
      if (initialData?.city_id) {
        processedData.city_id = initialData.city_id
      } else {
        if (!selectedCity) {
          setFormError('No active city selected. Pick a city in the navbar first.')
          setLoading(false)
          return
        }
        processedData.city_id = selectedCity.id
      }
      
      // Format start_date as date only (YYYY-MM-DD)
      if (data.start_date) {
        processedData.start_date = new Date(data.start_date).toISOString().split('T')[0]
      }
      
      // start_time should remain as time string (HH:MM:SS format)
      if (data.start_time) {
        // Ensure time is in HH:MM:SS format
        const timeParts = data.start_time.split(':')
        if (timeParts.length === 2) {
          processedData.start_time = `${data.start_time}:00`
        }
      }
      
      await onSubmit(processedData)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the event. Please try again.')
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
            placeholder="Event description"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          />
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Event Details</h3>
        
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

        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
            Format *
          </label>
          <select
            id="format"
            {...register('format', { required: 'Format is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm transition-colors px-4 py-2.5"
          >
            <option value="In-Person">In-Person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>
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
            placeholder="Event organisers"
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
                if (!value) return true // Optional field
                try {
                  new URL(value)
                  return true
                } catch {
                  return 'Please enter a valid URL (e.g., https://example.com)'
                }
              }
            })}
            placeholder="https://example.com/event"
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
              Highlight Event
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="partner_event"
              {...register('partner_event')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_event" className="ml-2 block text-sm text-gray-700">
              Partner Event
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sponsored_event"
              {...register('sponsored_event')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="sponsored_event" className="ml-2 block text-sm text-gray-700">
              Sponsored Event
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

