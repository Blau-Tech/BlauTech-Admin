'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import FormSection from './ui/FormSection'
import FormActions from './ui/FormActions'
import ErrorBanner from './ui/ErrorBanner'
import MultiSelect from './ui/MultiSelect'
import { TextField, TextareaField, CheckboxField } from './ui/FormField'

type CityName = 'MUNICH' | 'BERLIN' | 'MADRID'

const CITY_OPTIONS: CityName[] = ['MUNICH', 'BERLIN', 'MADRID']
const STUDY_LEVEL_OPTIONS = ['Bachelor', 'Masters', 'PhD', 'MBA', 'Postdoc']
const FIELD_OPTIONS = ['Computer Science', 'Business', 'Engineering', 'AI', 'Robotics', 'Medicine', 'Law', 'Other']

interface ScholarshipFormData {
  title: string
  organisation: string
  description: string
  url: string
  deadline?: string
  eligibility_notes?: string
  posted_linkedin?: boolean
  posted_whatsapp?: boolean
  posted_newsletter?: boolean
  is_highlight?: boolean
  is_published?: boolean
}

interface ScholarshipFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  title: string
}

const FLAGS: { id: keyof ScholarshipFormData; label: string }[] = [
  { id: 'is_published', label: 'Published on public website (approve)' },
  { id: 'posted_linkedin', label: 'Posted on LinkedIn' },
  { id: 'posted_whatsapp', label: 'Posted on WhatsApp' },
  { id: 'posted_newsletter', label: 'Posted in Newsletter' },
  { id: 'is_highlight', label: 'Highlight Scholarship' },
]

export default function ScholarshipForm({ initialData, onSubmit, onCancel }: ScholarshipFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScholarshipFormData>({ mode: 'onChange' })

  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [cities, setCities] = useState<string[]>([])
  const [studyLevel, setStudyLevel] = useState<string[]>([])
  const [fieldsOfStudy, setFieldsOfStudy] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        organisation: initialData.organisation || '',
        description: initialData.description || '',
        url: initialData.url || '',
        deadline: initialData.deadline || '',
        eligibility_notes: initialData.eligibility_notes || '',
        posted_linkedin: initialData.posted_linkedin || false,
        posted_whatsapp: initialData.posted_whatsapp || false,
        posted_newsletter: initialData.posted_newsletter || false,
        is_highlight: initialData.is_highlight || false,
        is_published: initialData.is_published ?? true,
      })
      setCities(Array.isArray(initialData.cities) ? initialData.cities : [])
      setStudyLevel(Array.isArray(initialData.study_level) ? initialData.study_level : [])
      setFieldsOfStudy(Array.isArray(initialData.fields_of_study) ? initialData.fields_of_study : [])
    } else {
      reset({
        title: '',
        organisation: '',
        description: '',
        url: '',
        deadline: '',
        eligibility_notes: '',
        posted_linkedin: false,
        posted_whatsapp: false,
        posted_newsletter: false,
        is_highlight: false,
        is_published: true,
      })
      setCities([])
      setStudyLevel([])
      setFieldsOfStudy([])
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: ScholarshipFormData) => {
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

      const payload = {
        title: data.title.trim(),
        organisation: data.organisation.trim(),
        description: data.description.trim(),
        url: data.url.trim(),
        deadline: data.deadline?.trim() ? data.deadline : null,
        eligibility_notes: data.eligibility_notes?.trim() ? data.eligibility_notes : null,
        cities,
        study_level: studyLevel,
        fields_of_study: fieldsOfStudy,
        posted_linkedin: !!data.posted_linkedin,
        posted_whatsapp: !!data.posted_whatsapp,
        posted_newsletter: !!data.posted_newsletter,
        is_highlight: !!data.is_highlight,
        is_published: !!data.is_published,
      }

      await onSubmit(payload)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the scholarship. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
      <ErrorBanner message={formError} onClose={() => setFormError('')} />

      <FormSection title="Basic Information" first>
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
          placeholder="Scholarship description"
          error={errors.description?.message}
          {...register('description', { required: 'Description is required' })}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="url"
            type="url"
            label="URL"
            required
            placeholder="https://example.com/scholarship"
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
        <MultiSelect label="Study Level" options={STUDY_LEVEL_OPTIONS} selected={studyLevel} onChange={setStudyLevel} />
        <MultiSelect label="Fields of Study" options={FIELD_OPTIONS} selected={fieldsOfStudy} onChange={setFieldsOfStudy} />

        <TextareaField
          id="eligibility_notes"
          label="Eligibility Notes"
          rows={3}
          placeholder="Free-text notes about eligibility (e.g. GPA, citizenship, etc.)"
          {...register('eligibility_notes')}
        />
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
