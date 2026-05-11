'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import FormSection from './ui/FormSection'
import FormActions from './ui/FormActions'
import ErrorBanner from './ui/ErrorBanner'
import MultiSelect from './ui/MultiSelect'
import { TextField, TextareaField, SelectField, CheckboxField } from './ui/FormField'

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

const FLAGS: { id: keyof OpportunityFormData; label: string }[] = [
  { id: 'posted_linkedin', label: 'Posted on LinkedIn' },
  { id: 'posted_whatsapp', label: 'Posted on WhatsApp' },
  { id: 'posted_newsletter', label: 'Posted in Newsletter' },
  { id: 'is_highlight', label: 'Highlight Opportunity' },
]

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
      <ErrorBanner message={formError} onClose={() => setFormError('')} />

      <FormSection title="Basic Information" first>
        <SelectField
          id="opportunity_type"
          label="Type"
          required
          {...register('opportunity_type', { required: 'Type is required' })}
        >
          <option value="PROGRAM">Program</option>
          <option value="FELLOWSHIP">Fellowship</option>
        </SelectField>

        <TextField
          id="title"
          label="Title"
          required
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />
        <TextField
          id="organisation"
          label="Organisation"
          required
          error={errors.organisation?.message}
          {...register('organisation', { required: 'Organisation is required' })}
        />
        <TextareaField
          id="description"
          label="Description"
          required
          placeholder="Opportunity description"
          error={errors.description?.message}
          {...register('description', { required: 'Description is required' })}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="url"
            type="url"
            label="URL"
            required
            placeholder="https://example.com/opportunity"
            error={errors.url?.message}
            {...register('url', { required: 'URL is required' })}
          />
          <TextField
            id="deadline"
            type="date"
            label="Deadline"
            {...register('deadline')}
          />
        </div>

        <MultiSelect label="Cities" options={CITY_OPTIONS} selected={cities} onChange={setCities} />
      </FormSection>

      <FormSection title="Publishing">
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
