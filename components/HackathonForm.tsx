'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import FormSection from './ui/FormSection'
import FormActions from './ui/FormActions'
import ErrorBanner from './ui/ErrorBanner'
import {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
} from './ui/FormField'

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
  is_published?: boolean
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

const FLAGS: { id: keyof HackathonFormData; label: string }[] = [
  { id: 'is_published', label: 'Published on public website (approve)' },
  { id: 'partner_event', label: 'Partner Hackathon' },
  { id: 'is_highlight', label: 'Highlight Hackathon' },
  { id: 'posted_linkedin', label: 'Posted on LinkedIn' },
  { id: 'posted_whatsapp', label: 'Posted on WhatsApp' },
  { id: 'posted_newsletter', label: 'Posted in Newsletter' },
]

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
        is_published: initialData.is_published ?? true,
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
        is_published: true,
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
        is_published: !!data.is_published,
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
      <ErrorBanner message={formError} onClose={() => setFormError('')} />

      <FormSection title="Basic Information" first>
        <TextField
          id="name"
          label="Name"
          required
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />
        <TextareaField
          id="description"
          label="Description"
          required
          placeholder="Hackathon description"
          error={errors.description?.message}
          {...register('description', { required: 'Description is required' })}
        />
        <TextField
          id="organisers"
          label="Organisers"
          required
          placeholder="Hackathon organisers"
          error={errors.organisers?.message}
          {...register('organisers', { required: 'Organisers are required' })}
        />
        <TextField
          id="link"
          type="url"
          label="Link"
          required
          placeholder="https://example.com/hackathon"
          error={errors.link?.message}
          {...register('link', { required: 'Link is required' })}
        />
      </FormSection>

      <FormSection title="Schedule">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="start_date"
            type="date"
            label="Start Date"
            required
            error={errors.start_date?.message}
            {...register('start_date', { required: 'Start date is required' })}
          />
          <TextField
            id="start_time"
            type="time"
            label="Start Time"
            required
            error={errors.start_time?.message}
            {...register('start_time', { required: 'Start time is required' })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="end_date"
            type="date"
            label="End Date"
            required
            error={errors.end_date?.message}
            {...register('end_date', { required: 'End date is required' })}
          />
          <TextField
            id="end_time"
            type="time"
            label="End Time"
            required
            error={errors.end_time?.message}
            {...register('end_time', { required: 'End time is required' })}
          />
        </div>
        <TextField
          id="signup_deadline"
          type="date"
          label="Signup Deadline"
          {...register('signup_deadline')}
        />
      </FormSection>

      <FormSection title="Location & Format">
        <SelectField
          id="format"
          label="Format"
          required
          {...register('format', { required: 'Format is required' })}
        >
          <option value="IN_PERSON">In-Person</option>
          <option value="ONLINE">Online</option>
          <option value="HYBRID">Hybrid</option>
        </SelectField>
        <TextField
          id="location"
          label="Location"
          required
          placeholder="Address or venue name (or 'Online')"
          error={errors.location?.message}
          {...register('location', { required: 'Location is required' })}
        />
        <SelectField id="city" label="City" {...register('city')}>
          <option value="">— None —</option>
          <option value="MUNICH">Munich</option>
          <option value="BERLIN">Berlin</option>
          <option value="MADRID">Madrid</option>
        </SelectField>
        <TextField
          id="image_url"
          type="url"
          label="Image URL"
          placeholder="https://example.com/image.jpg"
          {...register('image_url')}
        />
        <TextareaField
          id="prizes"
          label="Prizes"
          rows={2}
          placeholder="e.g. $10,000 grand prize, $5,000 runner-up"
          {...register('prizes')}
        />
      </FormSection>

      <FormSection title="Flags & Publishing">
        <div className="space-y-3">
          {FLAGS.map((item) => (
            <CheckboxField
              key={item.id}
              id={item.id}
              label={item.label}
              {...register(item.id as any)}
            />
          ))}
        </div>
      </FormSection>

      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  )
}
