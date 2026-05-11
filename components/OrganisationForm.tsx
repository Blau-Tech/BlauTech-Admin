'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import FormSection from './ui/FormSection'
import FormActions from './ui/FormActions'
import ErrorBanner from './ui/ErrorBanner'
import { TextField, TextareaField, SelectField, CheckboxField } from './ui/FormField'

type OrganisationType =
  | 'VC'
  | 'UNIVERSITY'
  | 'STUDENT_CLUB'
  | 'COMMUNITY'
  | 'INCUBATOR'
  | 'ACCELERATOR'

type CityName = 'MUNICH' | 'BERLIN' | 'MADRID'

interface OrganisationFormData {
  type: OrganisationType
  city: CityName
  name: string
  description: string
  website?: string
  investment_stage?: string
  is_highlight?: boolean
}

interface OrganisationFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  title: string
}

const TYPE_OPTIONS: { value: OrganisationType; label: string }[] = [
  { value: 'STUDENT_CLUB', label: 'Student Club' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'VC', label: 'VC' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'INCUBATOR', label: 'Incubator' },
  { value: 'ACCELERATOR', label: 'Accelerator' },
]

const CITY_OPTIONS: { value: CityName; label: string }[] = [
  { value: 'MUNICH', label: 'Munich' },
  { value: 'BERLIN', label: 'Berlin' },
  { value: 'MADRID', label: 'Madrid' },
]

const splitCsv = (raw: string): string[] =>
  raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

export default function OrganisationForm({ initialData, onSubmit, onCancel }: OrganisationFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<OrganisationFormData>({
    mode: 'onChange',
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [tags, setTags] = useState('')
  const [investmentFocus, setInvestmentFocus] = useState('')
  const [affiliatedUniversities, setAffiliatedUniversities] = useState('')

  const watchedType = watch('type')

  useEffect(() => {
    if (initialData) {
      reset({
        type: (initialData.type as OrganisationType) || 'STUDENT_CLUB',
        city: (initialData.city as CityName) || 'MUNICH',
        name: initialData.name || '',
        description: initialData.description || '',
        website: initialData.website || '',
        investment_stage: initialData.investment_stage || '',
        is_highlight: initialData.is_highlight || false,
      })
      setTags(Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '')
      setInvestmentFocus(
        Array.isArray(initialData.investment_focus) ? initialData.investment_focus.join(', ') : ''
      )
      setAffiliatedUniversities(
        Array.isArray(initialData.affiliated_universities)
          ? initialData.affiliated_universities.join(', ')
          : ''
      )
    } else {
      reset({
        type: 'STUDENT_CLUB',
        city: 'MUNICH',
        name: '',
        description: '',
        website: '',
        investment_stage: '',
        is_highlight: false,
      })
      setTags('')
      setInvestmentFocus('')
      setAffiliatedUniversities('')
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: OrganisationFormData) => {
    setFormError('')
    setLoading(true)

    try {
      if (data.website?.trim()) {
        try { new URL(data.website) } catch {
          setFormError('Please enter a valid website URL (e.g., https://example.com)')
          setLoading(false)
          return
        }
      }

      const isVc = data.type === 'VC'
      const isUniversity = data.type === 'UNIVERSITY'

      const tagsArr = splitCsv(tags)
      const investmentFocusArr = splitCsv(investmentFocus)
      const affiliatedUniversitiesArr = splitCsv(affiliatedUniversities)

      const payload: any = {
        type: data.type,
        city: data.city,
        name: data.name.trim(),
        description: data.description.trim(),
        website: data.website?.trim() ? data.website.trim() : null,
        tags: tagsArr.length ? tagsArr : null,
        investment_stage: isVc && data.investment_stage?.trim() ? data.investment_stage.trim() : null,
        investment_focus: isVc && investmentFocusArr.length ? investmentFocusArr : null,
        affiliated_universities:
          isUniversity && affiliatedUniversitiesArr.length ? affiliatedUniversitiesArr : null,
        is_highlight: !!data.is_highlight,
      }

      await onSubmit(payload)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the organisation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
      <ErrorBanner message={formError} onClose={() => setFormError('')} />

      <FormSection title="Basic Information" first>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            id="type"
            label="Type"
            required
            {...register('type', { required: 'Type is required' })}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </SelectField>
          <SelectField
            id="city"
            label="City"
            required
            {...register('city', { required: 'City is required' })}
          >
            {CITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </SelectField>
        </div>

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
          placeholder="What is this organisation about?"
          error={errors.description?.message}
          {...register('description', { required: 'Description is required' })}
        />
        <TextField
          id="website"
          type="url"
          label="Website"
          placeholder="https://example.com"
          {...register('website')}
        />

        <TextField
          id="tags"
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma-separated, e.g. AI, Robotics, Software"
          hint="Comma-separated values."
        />
      </FormSection>

      {watchedType === 'VC' && (
        <FormSection title="VC Details">
          <TextField
            id="investment_stage"
            label="Investment Stage"
            placeholder="e.g. Seed, Series A, Pre-Seed"
            {...register('investment_stage')}
          />

          <TextField
            id="investment_focus"
            label="Investment Focus"
            value={investmentFocus}
            onChange={(e) => setInvestmentFocus(e.target.value)}
            placeholder="Comma-separated, e.g. AI, Climate, Fintech"
            hint="Comma-separated values."
          />
        </FormSection>
      )}

      {watchedType === 'UNIVERSITY' && (
        <FormSection title="University Details">
          <TextField
            id="affiliated_universities"
            label="Affiliated Universities"
            value={affiliatedUniversities}
            onChange={(e) => setAffiliatedUniversities(e.target.value)}
            placeholder="Comma-separated, e.g. TUM, LMU, HM"
            hint="Comma-separated values."
          />
        </FormSection>
      )}

      <FormSection title="Flags">
        <CheckboxField
          id="is_highlight"
          label="Highlight Organisation"
          {...register('is_highlight')}
        />
      </FormSection>

      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  )
}
