'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import FormSection from './ui/FormSection'
import ErrorBanner from './ui/ErrorBanner'
import MultiSelect from './ui/MultiSelect'
import { TextField, TextareaField, CheckboxField } from './ui/FormField'
import type { ProgramReview, ReviewDecision } from '@/lib/programReviews'

const CITY_OPTIONS = ['MUNICH', 'BERLIN', 'MADRID']
const inputClass = 'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm'

interface OpportunityFormProps {
  initialData?: any
  review?: ProgramReview | null
  onSubmit: (data: any, decision?: ReviewDecision) => Promise<void>
  onCancel: () => void
  title: string
}

export default function OpportunityForm({ initialData, review, onSubmit, onCancel }: OpportunityFormProps) {
  const { register, handleSubmit, reset, watch } = useForm<Record<string, any>>()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [pageChecked, setPageChecked] = useState(false)
  const [newRound, setNewRound] = useState(false)
  const [reason, setReason] = useState('')
  const officialUrl = String(watch('url') || '').trim()

  useEffect(() => { setPageChecked(false) }, [officialUrl])

  useEffect(() => {
    const data = initialData || {}
    reset({
      ...data,
      url: data.clean_url || data.url || '',
      program_subtype: ['FELLOWSHIP', 'STUDENT_PROGRAM', 'CAREER_DEVELOPMENT', 'RESIDENCY', 'ACCELERATOR', 'INCUBATOR', 'FOUNDER_PROGRAM', 'STARTUP_FUNDING', 'COMMUNITY'].includes(data.program_subtype) ? data.program_subtype : '',
      application_status: data.application_status || 'UNKNOWN',
      individual_eligible: typeof data.individual_eligible === 'boolean' ? String(data.individual_eligible) : '',
      no_company_required: typeof data.no_company_required === 'boolean' ? String(data.no_company_required) : '',
      selective_program: typeof data.selective_program === 'boolean' ? String(data.selective_program) : '',
      scope_confirmed: data.scope_confirmed === true,
      excluded_program: typeof data.excluded_program === 'boolean' ? String(data.excluded_program) : '',
      is_highlight: data.is_highlight === true,
    })
    setCities(data.audience_cities || data.cities || [])
    setPageChecked(false)
    setNewRound(false)
    setReason('')
    setFormError('')
  }, [initialData, reset, review?.version])

  const submit = async (data: Record<string, any>, action: ReviewDecision['action']) => {
    setFormError('')
    if (action === 'REJECT' && !reason.trim()) {
      setFormError('Add a reason before rejecting this proposal.')
      return
    }
    setLoading(true)
    try {
      if (action === 'APPROVE' && (!['FELLOWSHIP','STUDENT_PROGRAM','CAREER_DEVELOPMENT','RESIDENCY','FOUNDER_PROGRAM','COMMUNITY'].includes(data.program_subtype) || data.individual_eligible !== 'true' || data.no_company_required !== 'true')) throw new Error('Approval requires an individual program with no existing company required.');
      let listing = data
      if (action !== 'REJECT') {
        const url = new URL(String(data.url || '').trim())
        if (url.protocol !== 'https:' || url.username || url.password) {
          throw new Error('Use an official HTTPS URL without embedded credentials.')
        }
        listing = {
          ...initialData,
          ...data,
          content_type: 'PROGRAM',
          opportunity_type: 'PROGRAM',
          clean_url: url.toString(),
          url: url.toString(),
          title: String(data.title || '').trim(),
          organisation: String(data.organisation || '').trim(),
          description: String(data.description || '').trim(),
          city: cities[0] || 'BERLIN',
          audience_scope: cities.length ? 'CITY' : 'GLOBAL',
          audience_cities: cities,
          program_subtype: data.program_subtype || null,
          individual_eligible: data.individual_eligible === 'true' ? true : data.individual_eligible === 'false' ? false : null,
          no_company_required: data.no_company_required === 'true' ? true : data.no_company_required === 'false' ? false : null,
          selective_program: data.selective_program === 'true' ? true : data.selective_program === 'false' ? false : null,
          excluded_program: data.excluded_program === 'true' ? true : data.excluded_program === 'false' ? false : null,
          deadline: data.deadline || null,
          application_open_date: data.application_open_date || null,
          program_start_date: data.program_start_date || null,
          program_end_date: data.program_end_date || null,
          format: data.format || null,
          location_scope: data.location_scope || null,
          location: String(data.location || '').trim() || null,
          image_url: String(data.image_url || '').trim() || null,
          is_published: false,
        }
      }
      await onSubmit(listing, {
        action,
        reason,
        officialPageChecked: pageChecked,
        newApplicationRound: newRound,
      })
    } catch (err: any) {
      setFormError(err.message || 'Could not save the review. Reload if someone else changed it.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit((data, event) => {
        const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter
        return submit(data, submitter instanceof HTMLButtonElement && submitter.value === 'APPROVE' ? 'APPROVE' : 'SAVE')
      })}
      className="space-y-5 max-h-[80vh] overflow-y-auto pr-2"
    >
      <ErrorBanner message={formError} onClose={() => setFormError('')} />
      <p className="text-sm text-gray-600">
        {review?.opportunity_id || initialData?.id
          ? 'The public listing stays unchanged until these changes are approved.'
          : 'Saving creates a private draft. An admin must approve it before publication.'}
      </p>
      {review && (
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <p>Proposal version {review.version}</p>
          <p>Last verified: {review.verified_at ? new Date(review.verified_at).toLocaleString() : 'Not verified'}</p>
          {officialUrl.startsWith('https://') && (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-primary-700 underline">
              Open official source
            </a>
          )}
        </div>
      )}
      {review?.base_listing && (
        <details className="rounded-lg border border-gray-200 p-3 text-sm">
          <summary className="cursor-pointer font-medium">Current public version</summary>
          <dl className="mt-2 space-y-1 text-gray-600">
            <div><dt className="inline font-medium">Title: </dt><dd className="inline">{review.base_listing.title}</dd></div>
            <div><dt className="inline font-medium">Applications: </dt><dd className="inline">{review.base_listing.application_status || 'Unknown'}</dd></div>
            <div><dt className="inline font-medium">Deadline: </dt><dd className="inline">{review.base_listing.deadline || 'Not stated'}</dd></div>
            <div><dt className="inline font-medium">Starts: </dt><dd className="inline">{review.base_listing.program_start_date || 'Not stated'}</dd></div>
            <div><dt className="inline font-medium">Eligibility: </dt><dd className="inline">{review.base_listing.eligibility_notes || 'Not stated'}</dd></div>
          </dl>
        </details>
      )}

      <FormSection title="Program details" first>
        <TextField id="title" label="Title" required {...register('title', { required: true })} />
        <TextField id="organisation" label="Organisation" required {...register('organisation', { required: true })} />
        <TextareaField id="description" label="Description" required {...register('description', { required: true })} />
        <TextField id="url" type="url" label="Official application page" required {...register('url', { required: true })} />
        <label className="block text-sm font-medium text-gray-700">
          Detailed program type
          <select {...register('program_subtype')} className={inputClass}>
            <option value="">Unclear — needs review</option>
            <option value="FELLOWSHIP">Fellowship</option>
            <option value="RESIDENCY">Residency</option>
            <option value="COMMUNITY">Builder community</option>
            <option value="STUDENT_PROGRAM">Student program</option>
            <option value="CAREER_DEVELOPMENT">Career development</option>


            <option value="FOUNDER_PROGRAM">Individual builder / founder program</option>

          </select>
        </label>
        <MultiSelect label="BlauTech audience cities (empty means all cities)" options={CITY_OPTIONS} selected={cities} onChange={setCities} />
        <TextareaField id="eligibility_notes" label="Who can apply, including age, country and team restrictions" {...register('eligibility_notes')} />
        <TextareaField id="benefits" label="Support and costs, including funding, fees or equity terms" {...register('benefits')} />
        <TextareaField id="evidence" label="Official evidence for eligibility and application status" {...register('evidence')} />
        <TextField id="location" label="Venue or location" {...register('location')} />
        <label className="block text-sm font-medium text-gray-700">
          Format
          <select {...register('format')} className={inputClass}>
            <option value="">Not stated</option>
            <option value="IN_PERSON">In person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Where the program takes place (separate from applicant eligibility)
          <select {...register('location_scope')} className={inputClass}>
            <option value="">Not stated</option>
            {['BERLIN', 'MUNICH', 'GERMANY', 'EUROPE', 'REMOTE', 'GLOBAL', 'OTHER'].map(scope => <option key={scope} value={scope}>{scope}</option>)}
          </select>
        </label>
        <TextField id="image_url" type="url" label="Listing image URL" {...register('image_url')} />
      </FormSection>

      <FormSection title="Applications and program dates">
        <label className="block text-sm font-medium text-gray-700">
          Application status
          <select {...register('application_status')} className={inputClass}>
            <option value="UNKNOWN">Unknown — needs review</option>
            <option value="OPEN">Open</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ROLLING">Rolling applications confirmed</option>
            <option value="CLOSED">Closed or cancelled</option>
          </select>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id="application_open_date" type="date" label="Applications open" {...register('application_open_date')} />
          <TextField id="deadline" type="date" label="Application deadline" {...register('deadline')} />
          <TextField id="program_start_date" type="date" label="Program starts" {...register('program_start_date')} />
          <TextField id="program_end_date" type="date" label="Program ends" {...register('program_end_date')} />
        </div>
      </FormSection>

      <FormSection title="Eligibility checks">
        <p className="text-sm text-gray-600">Focus: fellowships and learning programs; residencies and hacker houses. Approval requires individual eligibility without an existing startup or company. Exclude scholarships, ordinary jobs, accelerators, incubators, startup funding and accommodation alone. Student and career programs need a structured tech offer.</p>
        <label className="block text-sm font-medium text-gray-700">
          Can individuals apply?
          <select {...register('individual_eligible')} className={inputClass}>
            <option value="">Unknown — needs review</option>
            <option value="true">Yes — confirmed on the official page</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Existing company requirement
          <select {...register('no_company_required')} className={inputClass}>
            <option value="">Unknown — needs review</option>
            <option value="true">No existing company required</option>
            <option value="false">Existing company required</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Are participants selected through an application process?
          <select {...register('selective_program')} className={inputClass}>
            <option value="">Unknown — needs review</option>
            <option value="true">Yes — confirmed on the official page</option>
            <option value="false">No</option>
          </select>
        </label>
        <CheckboxField id="scope_confirmed" label="This is a relevant tech or founder opportunity and its applicant geography fits BlauTech’s audience" {...register('scope_confirmed')} />
        <label className="block text-sm font-medium text-gray-700">
          Excluded: scholarship, job/internship, medical training, unrelated program, generic course catalogue or open networking membership
          <select {...register('excluded_program')} className={inputClass}>
            <option value="">Unknown — needs review</option>
            <option value="false">No — this is an eligible program type</option>
            <option value="true">Yes — exclude this program</option>
          </select>
        </label>
        <CheckboxField id="is_highlight" label="Highlight after approval" {...register('is_highlight')} />
      </FormSection>

      {review && (
        <FormSection title="Review decision">
          <CheckboxField id="official-page-checked" label="I checked the official application page and confirmed these details today" checked={pageChecked} onChange={event => setPageChecked(event.target.checked)} />
          {review.opportunity_id && (
            <CheckboxField id="new-application-round" label="This is a new application round; make it eligible for sharing again after approval" checked={newRound} onChange={event => setNewRound(event.target.checked)} />
          )}
          <TextareaField id="rejection-reason" label="Rejection reason" value={reason} onChange={event => setReason(event.target.value)} />
        </FormSection>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
        <button type="button" onClick={onCancel} disabled={loading} className="rounded-lg border px-4 py-2">Cancel</button>
        {review && <button type="button" onClick={() => submit({}, 'REJECT')} disabled={loading} className="rounded-lg border border-red-300 px-4 py-2 text-red-700">Reject</button>}
        <button type="submit" value="SAVE" disabled={loading} className="rounded-lg border px-4 py-2">{loading ? 'Saving…' : 'Save draft'}</button>
        {review && <button type="submit" value="APPROVE" disabled={loading || !pageChecked} className="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">Approve reviewed version</button>}
      </div>
    </form>
  )
}
