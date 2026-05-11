'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

type EventFormat = 'IN_PERSON' | 'ONLINE' | 'HYBRID'
type CityName = '' | 'MUNICH' | 'BERLIN' | 'MADRID'

interface HackathonFormData {
  name: string
  description: string
  organisers: string
  link: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  signup_deadline?: string
  prizes?: string
  location: string
  city?: CityName
  image_url?: string
  format: EventFormat
  partner_event?: boolean
  posted_linkedin?: boolean
  posted_whatsapp?: boolean
  posted_newsletter?: boolean
  is_highlight?: boolean
}

interface HackathonFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  title: string
}

const toTimeInput = (value: string | null | undefined): string => {
  if (!value) return ''
  return value.slice(0, 5)
}

const toDateInput = (value: string | null | undefined): string => {
  if (!value) return ''
  return value.slice(0, 10)
}

const normaliseTime = (value: string | undefined): string | null => {
  if (!value) return null
  const parts = value.split(':')
  if (parts.length === 2) return `${value}:00`
  return value
}

export default function HackathonForm({ initialData, onSubmit, onCancel }: HackathonFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<HackathonFormData>({
    mode: 'onChange',
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        organisers: initialData.organisers || '',
        link: initialData.link || '',
        start_date: toDateInput(initialData.start_date),
        start_time: toTimeInput(initialData.start_time),
        end_date: toDateInput(initialData.end_date),
        end_time: toTimeInput(initialData.end_time),
        signup_deadline: toDateInput(initialData.signup_deadline),
        prizes: initialData.prizes || '',
        location: initialData.location || '',
        city: (initialData.city as CityName) || '',
        image_url: initialData.image_url || '',
        format: (initialData.format as EventFormat) || 'IN_PERSON',
        partner_event: initialData.partner_event || false,
        posted_linkedin: initialData.posted_linkedin || false,
        posted_whatsapp: initialData.posted_whatsapp || false,
        posted_newsletter: initialData.posted_newsletter || false,
        is_highlight: initialData.is_highlight || false,
      })
    } else {
      reset({
        name: '',
        description: '',
        organisers: '',
        link: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        signup_deadline: '',
        prizes: '',
        location: '',
        city: '',
        image_url: '',
        format: 'IN_PERSON',
        partner_event: false,
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
      if (data.link?.trim()) {
        try {
          new URL(data.link)
        } catch {
          setFormError('Please enter a valid URL (e.g., https://example.com)')
          setLoading(false)
          return
        }
      }

      if (data.image_url?.trim()) {
        try {
          new URL(data.image_url)
        } catch {
          setFormError('Please enter a valid image URL.')
          setLoading(false)
          return
        }
      }

      const payload: any = {
        name: data.name.trim(),
        description: data.description.trim(),
        organisers: data.organisers.trim(),
        link: data.link.trim(),
        start_date: data.start_date,
        start_time: normaliseTime(data.start_time),
        end_date: data.end_date,
        end_time: normaliseTime(data.end_time),
        signup_deadline: data.signup_deadline?.trim() ? data.signup_deadline : null,
        prizes: data.prizes?.trim() ? data.prizes : null,
        location: data.location.trim(),
        city: data.city ? data.city : null,
        image_url: data.image_url?.trim() ? data.image_url : null,
        format: data.format,
        partner_event: !!data.partner_event,
        posted_linkedin: !!data.posted_linkedin,
        posted_whatsapp: !!data.posted_whatsapp,
        posted_newsletter: !!data.posted_newsletter,
        is_highlight: !!data.is_highlight,
      }

      await onSubmit(payload)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the hackathon. Please try again.')
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" id="name" {...register('name', { required: 'Name is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea id="description" rows={4} {...register('description', { required: 'Description is required' })}
            placeholder="Hackathon description"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="organisers" className="block text-sm font-medium text-gray-700 mb-1">Organisers *</label>
          <input type="text" id="organisers" {...register('organisers', { required: 'Organisers are required' })}
            placeholder="Hackathon organisers"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.organisers && <p className="mt-1 text-sm text-red-600">{errors.organisers.message}</p>}
        </div>

        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">Link *</label>
          <input type="url" id="link" {...register('link', { required: 'Link is required' })}
            placeholder="https://example.com/hackathon"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.link && <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Schedule</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input type="date" id="start_date" {...register('start_date', { required: 'Start date is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
          </div>
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input type="time" id="start_time" {...register('start_time', { required: 'Start time is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input type="date" id="end_date" {...register('end_date', { required: 'End date is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
            <input type="time" id="end_time" {...register('end_time', { required: 'End time is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="signup_deadline" className="block text-sm font-medium text-gray-700 mb-1">Signup Deadline</label>
          <input type="date" id="signup_deadline" {...register('signup_deadline')}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location & Format</h3>

        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">Format *</label>
          <select id="format" {...register('format', { required: 'Format is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5">
            <option value="IN_PERSON">In-Person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input type="text" id="location" {...register('location', { required: 'Location is required' })}
            placeholder="Address or venue name (or 'Online')"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select id="city" {...register('city')}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5">
            <option value="">— None —</option>
            <option value="MUNICH">Munich</option>
            <option value="BERLIN">Berlin</option>
            <option value="MADRID">Madrid</option>
          </select>
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input type="url" id="image_url" {...register('image_url')}
            placeholder="https://example.com/image.jpg"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
        </div>

        <div>
          <label htmlFor="prizes" className="block text-sm font-medium text-gray-700 mb-1">Prizes</label>
          <textarea id="prizes" rows={2} {...register('prizes')}
            placeholder="e.g. $10,000 grand prize, $5,000 runner-up"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Flags & Publishing</h3>

        <div className="space-y-3">
          {[
            { id: 'partner_event', label: 'Partner Hackathon' },
            { id: 'is_highlight', label: 'Highlight Hackathon' },
            { id: 'posted_linkedin', label: 'Posted on LinkedIn' },
            { id: 'posted_whatsapp', label: 'Posted on WhatsApp' },
            { id: 'posted_newsletter', label: 'Posted in Newsletter' },
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
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
