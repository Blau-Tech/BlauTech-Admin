'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { eligibilityCriteriaApi, benefitTypesApi } from '@/lib/api'

interface ScholarshipFormData {
  title: string
  provider: string
  short_description?: string
  url: string
  deadline?: string
  posted_linkedin?: boolean
  posted_whatsapp?: boolean
  posted_newsletter?: boolean
  is_highlight?: boolean
}

interface ScholarshipFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  title: string
}

const STUDY_LEVEL_OPTIONS = ['Bachelor', 'Masters', 'PhD', 'MBA', 'Postdoc']
const FIELD_OPTIONS = ['Computer Science', 'Business', 'Engineering', 'AI', 'Robotics', 'Medicine', 'Law', 'Other']

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selected.includes(option)
                ? 'bg-primary-100 border-primary-400 text-primary-800'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

// Renders the right input based on value_type
function CriteriaInput({
  valueType,
  value,
  onChange,
}: {
  valueType: string
  value: string
  onChange: (v: string) => void
}) {
  if (valueType === 'boolean') return null // checkbox-only, no extra input

  if (valueType === 'number' || valueType === 'currency') {
    return (
      <input
        type="number"
        step={valueType === 'currency' ? '0.01' : '1'}
        value={value === 'true' ? '' : value}
        onChange={(e) => onChange(e.target.value || 'true')}
        placeholder={valueType === 'currency' ? 'e.g. 300.00' : 'e.g. 2.5'}
        className="ml-2 w-28 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm px-2 py-1"
      />
    )
  }

  // text
  return (
    <input
      type="text"
      value={value === 'true' ? '' : value}
      onChange={(e) => onChange(e.target.value || 'true')}
      placeholder="Value..."
      className="ml-2 w-36 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm px-2 py-1"
    />
  )
}

export default function ScholarshipForm({ initialData, onSubmit, onCancel }: ScholarshipFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScholarshipFormData>({ mode: 'onChange' })

  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Array state for multi-select
  const [studyLevel, setStudyLevel] = useState<string[]>([])
  const [fieldsOfStudy, setFieldsOfStudy] = useState<string[]>([])

  // Lookup data from DB
  const [allCriteria, setAllCriteria] = useState<any[]>([])
  const [allBenefitTypes, setAllBenefitTypes] = useState<any[]>([])

  // Selected entries: Map<criteria_id, value>
  const [selectedEligibility, setSelectedEligibility] = useState<Record<string, string>>({})
  const [selectedBenefits, setSelectedBenefits] = useState<Record<string, string>>({})

  // Load lookup tables on mount
  useEffect(() => {
    eligibilityCriteriaApi.fetch().then(setAllCriteria)
    benefitTypesApi.fetch().then(setAllBenefitTypes)
  }, [])

  // Initialize form when initialData or lookup tables change
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        provider: initialData.provider || '',
        short_description: initialData.short_description || '',
        url: initialData.url || '',
        deadline: initialData.deadline || '',
        posted_linkedin: initialData.posted_linkedin || false,
        posted_whatsapp: initialData.posted_whatsapp || false,
        posted_newsletter: initialData.posted_newsletter || false,
        is_highlight: initialData.is_highlight || false,
      })
      setStudyLevel(initialData.study_level || [])
      setFieldsOfStudy(initialData.fields_of_study || [])

      // Build eligibility map from existing junction entries
      const elMap: Record<string, string> = {}
      const elEntries = initialData.scholarship_eligibility || []
      for (const entry of elEntries) {
        const criteriaId = entry.eligibility_criteria?.id || entry.criteria_id
        if (criteriaId) elMap[criteriaId] = entry.value || 'true'
      }
      setSelectedEligibility(elMap)

      // Build benefits map
      const bnMap: Record<string, string> = {}
      const bnEntries = initialData.scholarship_benefits || []
      for (const entry of bnEntries) {
        const typeId = entry.benefit_types?.id || entry.benefit_type_id
        if (typeId) bnMap[typeId] = entry.value || 'true'
      }
      setSelectedBenefits(bnMap)
    } else {
      reset({
        posted_linkedin: false,
        posted_whatsapp: false,
        posted_newsletter: false,
        is_highlight: false,
      })
      setStudyLevel([])
      setFieldsOfStudy([])
      setSelectedEligibility({})
      setSelectedBenefits({})
    }
  }, [initialData, reset])

  const toggleEligibility = (criteriaId: string, valueType: string) => {
    setSelectedEligibility((prev) => {
      const next = { ...prev }
      if (next[criteriaId]) {
        delete next[criteriaId]
      } else {
        next[criteriaId] = valueType === 'boolean' ? 'true' : ''
      }
      return next
    })
  }

  const setEligibilityValue = (criteriaId: string, value: string) => {
    setSelectedEligibility((prev) => ({ ...prev, [criteriaId]: value }))
  }

  const toggleBenefit = (typeId: string, valueType: string) => {
    setSelectedBenefits((prev) => {
      const next = { ...prev }
      if (next[typeId]) {
        delete next[typeId]
      } else {
        next[typeId] = valueType === 'boolean' ? 'true' : ''
      }
      return next
    })
  }

  const setBenefitValue = (typeId: string, value: string) => {
    setSelectedBenefits((prev) => ({ ...prev, [typeId]: value }))
  }

  // Group by category
  const groupByCategory = (items: any[]) => {
    const groups: Record<string, any[]> = {}
    for (const item of items) {
      const cat = item.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  }

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

      // Build eligibility entries array
      const eligibility = Object.entries(selectedEligibility)
        .filter(([, v]) => v !== '')
        .map(([criteria_id, value]) => ({ criteria_id, value: value || 'true' }))

      // Build benefits entries array
      const benefits = Object.entries(selectedBenefits)
        .filter(([, v]) => v !== '')
        .map(([benefit_type_id, value]) => ({ benefit_type_id, value: value || 'true' }))

      const payload = {
        title: data.title,
        provider: data.provider,
        short_description: data.short_description || null,
        url: data.url,
        deadline: data.deadline || null,
        study_level: studyLevel,
        fields_of_study: fieldsOfStudy,
        posted_linkedin: data.posted_linkedin || false,
        posted_whatsapp: data.posted_whatsapp || false,
        posted_newsletter: data.posted_newsletter || false,
        is_highlight: data.is_highlight || false,
        eligibility,
        benefits,
      }

      await onSubmit(payload)
    } catch (err: any) {
      console.error('Form submission error:', err)
      setFormError(err.message || 'An error occurred while saving the scholarship. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const criteriaByCategory = groupByCategory(allCriteria)
  const benefitsByCategory = groupByCategory(allBenefitTypes)

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

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" id="title" {...register('title', { required: 'Title is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
          <input type="text" id="provider" {...register('provider', { required: 'Provider is required' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          {errors.provider && <p className="mt-1 text-sm text-red-600">{errors.provider.message}</p>}
        </div>

        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="short_description" rows={4} {...register('short_description')} placeholder="Scholarship description"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input type="url" id="url" {...register('url', { required: 'URL is required' })} placeholder="https://example.com/scholarship"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
            {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>}
          </div>
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input type="text" id="deadline" {...register('deadline')} placeholder="e.g. 2025-12-31"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 sm:text-sm px-4 py-2.5" />
          </div>
        </div>

        <MultiSelect label="Study Level" options={STUDY_LEVEL_OPTIONS} selected={studyLevel} onChange={setStudyLevel} />
        <MultiSelect label="Fields of Study" options={FIELD_OPTIONS} selected={fieldsOfStudy} onChange={setFieldsOfStudy} />
      </div>

      {/* Eligibility Requirements — dynamic from DB */}
      <CollapsibleSection title="Eligibility Requirements">
        {Object.entries(criteriaByCategory).map(([category, criteria]) => (
          <div key={category}>
            <label className="block text-sm font-medium text-gray-500 mb-2 capitalize">{category}</label>
            <div className="space-y-2">
              {criteria.map((c: any) => (
                <div key={c.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`el_${c.id}`}
                    checked={!!selectedEligibility[c.id]}
                    onChange={() => toggleEligibility(c.id, c.value_type)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`el_${c.id}`} className="ml-2 text-sm text-gray-700">{c.name}</label>
                  {selectedEligibility[c.id] !== undefined && c.value_type !== 'boolean' && (
                    <CriteriaInput
                      valueType={c.value_type}
                      value={selectedEligibility[c.id]}
                      onChange={(v) => setEligibilityValue(c.id, v)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {allCriteria.length === 0 && (
          <p className="text-sm text-gray-500">Loading criteria...</p>
        )}
      </CollapsibleSection>

      {/* Benefits — dynamic from DB */}
      <CollapsibleSection title="Benefits">
        {Object.entries(benefitsByCategory).map(([category, types]) => (
          <div key={category}>
            <label className="block text-sm font-medium text-gray-500 mb-2 capitalize">{category}</label>
            <div className="space-y-2">
              {types.map((bt: any) => (
                <div key={bt.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`bn_${bt.id}`}
                    checked={!!selectedBenefits[bt.id]}
                    onChange={() => toggleBenefit(bt.id, bt.value_type)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`bn_${bt.id}`} className="ml-2 text-sm text-gray-700">{bt.name}</label>
                  {selectedBenefits[bt.id] !== undefined && bt.value_type !== 'boolean' && (
                    <CriteriaInput
                      valueType={bt.value_type}
                      value={selectedBenefits[bt.id]}
                      onChange={(v) => setBenefitValue(bt.id, v)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {allBenefitTypes.length === 0 && (
          <p className="text-sm text-gray-500">Loading benefit types...</p>
        )}
      </CollapsibleSection>

      {/* Publishing */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Publishing</h3>
        <div className="space-y-3">
          {[
            { id: 'posted_linkedin', label: 'Posted on LinkedIn' },
            { id: 'posted_whatsapp', label: 'Posted on WhatsApp' },
            { id: 'posted_newsletter', label: 'Posted in Newsletter' },
            { id: 'is_highlight', label: 'Highlight Scholarship' },
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
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
