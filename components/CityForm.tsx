'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

export interface CityFormData {
  slug: string
  name: string
  enabled: boolean
  show_events: boolean
  show_hackathons: boolean
  show_scholarships: boolean
  show_clubs: boolean
}

const ALL_SECTIONS = ['events', 'hackathons', 'scholarships', 'clubs'] as const
type Section = (typeof ALL_SECTIONS)[number]

interface GeocodeResult {
  lat: number
  lng: number
  country: string
  display_name: string
}

// OpenStreetMap Nominatim — free, no API key, rate-limited to 1 req/sec.
async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  if (!res.ok) return null
  const rows = await res.json()
  if (!rows || rows.length === 0) return null
  const r = rows[0]
  return {
    lat: Number(r.lat),
    lng: Number(r.lon),
    country: (r.address?.country_code || 'DE').toUpperCase(),
    display_name: r.display_name,
  }
}

interface CityFormProps {
  initialData?: any
  onSubmit: (payload: {
    slug: string
    name: string
    country: string
    timezone: string
    lang: string
    lat: number | null
    lng: number | null
    enabled: boolean
    enabled_sections: Section[]
    hero_copy: Record<string, any> | null
  }) => Promise<void>
  onCancel: () => void
  title: string
  isEdit?: boolean
}

export default function CityForm({ initialData, onSubmit, onCancel, title, isEdit }: CityFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CityFormData>({
    mode: 'onChange',
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [geocodeNote, setGeocodeNote] = useState<string | null>(null)

  useEffect(() => {
    const sections: Section[] = (initialData?.enabled_sections as Section[] | undefined)
      ?? ([...ALL_SECTIONS])
    if (initialData) {
      reset({
        slug: initialData.slug || '',
        name: initialData.name || '',
        enabled: initialData.enabled ?? true,
        show_events: sections.includes('events'),
        show_hackathons: sections.includes('hackathons'),
        show_scholarships: sections.includes('scholarships'),
        show_clubs: sections.includes('clubs'),
      })
    } else {
      reset({
        slug: '', name: '', enabled: true,
        show_events: true, show_hackathons: true, show_scholarships: true, show_clubs: true,
      })
    }
    setGeocodeNote(null)
  }, [initialData, reset])

  const onSubmitForm = async (data: CityFormData) => {
    setFormError('')
    setGeocodeNote(null)
    setLoading(true)
    try {
      // On edit, keep the existing coordinates unless the name changed substantially.
      // On create, geocode the city name to get lat/lng/country automatically.
      let lat: number | null = initialData?.lat ?? null
      let lng: number | null = initialData?.lng ?? null
      let country: string = initialData?.country ?? 'DE'

      const nameChanged = !initialData || initialData.name?.trim().toLowerCase() !== data.name.trim().toLowerCase()
      if (nameChanged) {
        setGeocodeNote('Looking up coordinates…')
        const geo = await geocodeCity(data.name.trim())
        if (geo) {
          lat = geo.lat
          lng = geo.lng
          country = geo.country
          setGeocodeNote(`📍 ${geo.display_name}`)
        } else {
          setGeocodeNote('⚠ Could not auto-locate this city — saving without map coordinates.')
        }
      }

      const enabledSections: Section[] = [
        data.show_events && 'events',
        data.show_hackathons && 'hackathons',
        data.show_scholarships && 'scholarships',
        data.show_clubs && 'clubs',
      ].filter(Boolean) as Section[]

      await onSubmit({
        slug: data.slug.trim().toLowerCase(),
        name: data.name.trim(),
        country,
        timezone: 'Europe/Berlin',
        lang: 'de',
        lat,
        lng,
        enabled: data.enabled,
        enabled_sections: enabledSections,
        hero_copy: initialData?.hero_copy ?? null,
      })
    } catch (e: any) {
      setFormError(e.message || 'Failed to save city')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

      {formError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {formError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (= subdomain)</label>
        <input
          type="text"
          disabled={isEdit}
          placeholder="berlin"
          {...register('slug', {
            required: 'Slug is required',
            pattern: { value: /^[a-z0-9-]+$/, message: 'Lowercase letters, digits, and dashes only' },
            minLength: { value: 2, message: 'At least 2 characters' },
            maxLength: { value: 64, message: 'At most 64 characters' },
          })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100"
        />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
        <input
          type="text"
          placeholder="Berlin"
          {...register('name', { required: 'Name is required', maxLength: 128 })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      {geocodeNote && (
        <p className="text-xs text-gray-600">{geocodeNote}</p>
      )}

      <fieldset className="rounded-md border border-gray-200 p-3">
        <legend className="px-1 text-sm font-medium text-gray-700">Show these sections</legend>
        <p className="text-xs text-gray-500 mb-2">
          Uncheck any section you don&rsquo;t want to surface for this city (e.g. scholarships outside Germany).
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SectionCheckbox id="show_events" label="Events" register={register} />
          <SectionCheckbox id="show_hackathons" label="Hackathons" register={register} />
          <SectionCheckbox id="show_scholarships" label="Scholarships" register={register} />
          <SectionCheckbox id="show_clubs" label="Clubs" register={register} />
        </div>
      </fieldset>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="enabled"
          {...register('enabled')}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="enabled" className="text-sm text-gray-700">
          Enabled (publicly visible)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2 city-form-footer">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create city'}
        </button>
      </div>
    </form>
  )
}

function SectionCheckbox({
  id, label, register,
}: { id: keyof CityFormData; label: string; register: any }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        {...register(id)}
        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      {label}
    </label>
  )
}
