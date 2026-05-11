'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

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

  // Array fields stored separately and serialised as comma-separated for the input.
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select id="type" {...register('type', { required: 'Type is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5">
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <select id="city" {...register('city', { required: 'City is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5">
              {CITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" id="name" {...register('name', { required: 'Name is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea id="description" rows={4} {...register('description', { required: 'Description is required' })}
            placeholder="What is this organisation about?"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input type="url" id="website" {...register('website')} placeholder="https://example.com"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated, e.g. AI, Robotics, Software"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          <p className="mt-1 text-xs text-gray-500">Comma-separated values.</p>
        </div>
      </div>

      {watchedType === 'VC' && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">VC Details</h3>

          <div>
            <label htmlFor="investment_stage" className="block text-sm font-medium text-gray-700 mb-1">Investment Stage</label>
            <input type="text" id="investment_stage" {...register('investment_stage')}
              placeholder="e.g. Seed, Series A, Pre-Seed"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          </div>

          <div>
            <label htmlFor="investment_focus" className="block text-sm font-medium text-gray-700 mb-1">Investment Focus</label>
            <input type="text" id="investment_focus" value={investmentFocus}
              onChange={(e) => setInvestmentFocus(e.target.value)}
              placeholder="Comma-separated, e.g. AI, Climate, Fintech"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            <p className="mt-1 text-xs text-gray-500">Comma-separated values.</p>
          </div>
        </div>
      )}

      {watchedType === 'UNIVERSITY' && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">University Details</h3>

          <div>
            <label htmlFor="affiliated_universities" className="block text-sm font-medium text-gray-700 mb-1">Affiliated Universities</label>
            <input type="text" id="affiliated_universities" value={affiliatedUniversities}
              onChange={(e) => setAffiliatedUniversities(e.target.value)}
              placeholder="Comma-separated, e.g. TUM, LMU, HM"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            <p className="mt-1 text-xs text-gray-500">Comma-separated values.</p>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Flags</h3>
        <div className="flex items-center">
          <input type="checkbox" id="is_highlight" {...register('is_highlight')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
          <label htmlFor="is_highlight" className="ml-2 block text-sm text-gray-700">Highlight Organisation</label>
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
