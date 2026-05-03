'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

export interface CityFormData {
  slug: string
  name: string
  country: string
  timezone: string
  lang: string
  lat: string
  lng: string
  enabled: boolean
  hero_copy_json: string
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

  useEffect(() => {
    if (initialData) {
      reset({
        slug: initialData.slug || '',
        name: initialData.name || '',
        country: initialData.country || 'DE',
        timezone: initialData.timezone || 'Europe/Berlin',
        lang: initialData.lang || 'de',
        lat: initialData.lat != null ? String(initialData.lat) : '',
        lng: initialData.lng != null ? String(initialData.lng) : '',
        enabled: initialData.enabled ?? true,
        hero_copy_json: initialData.hero_copy ? JSON.stringify(initialData.hero_copy, null, 2) : '',
      })
    } else {
      reset({
        slug: '', name: '', country: 'DE', timezone: 'Europe/Berlin', lang: 'de',
        lat: '', lng: '', enabled: true, hero_copy_json: '',
      })
    }
  }, [initialData, reset])

  const onSubmitForm = async (data: CityFormData) => {
    setFormError('')

    let heroCopy: Record<string, any> | null = null
    if (data.hero_copy_json && data.hero_copy_json.trim()) {
      try {
        const parsed = JSON.parse(data.hero_copy_json)
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          setFormError('hero_copy must be a JSON object')
          return
        }
        heroCopy = parsed
      } catch (e: any) {
        setFormError(`Invalid JSON in hero_copy: ${e.message}`)
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit({
        slug: data.slug.trim().toLowerCase(),
        name: data.name.trim(),
        country: data.country.trim().toUpperCase(),
        timezone: data.timezone.trim(),
        lang: data.lang.trim().toLowerCase(),
        lat: data.lat ? Number(data.lat) : null,
        lng: data.lng ? Number(data.lng) : null,
        enabled: data.enabled,
        hero_copy: heroCopy,
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
        <p className="mt-1 text-xs text-gray-500">Cannot be changed after creation. Becomes <code>{`{slug}.blau-tech.de`}</code>.</p>
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country (ISO-2)</label>
          <input
            type="text"
            maxLength={2}
            {...register('country', { required: true, pattern: /^[A-Za-z]{2}$/ })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <input
            type="text"
            placeholder="Europe/Berlin"
            {...register('timezone', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <input
            type="text"
            maxLength={8}
            {...register('lang', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            step="0.000001"
            {...register('lat')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            step="0.000001"
            {...register('lng')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hero copy (JSON object) — optional
        </label>
        <textarea
          rows={6}
          placeholder='{"events_description": "Discover meetups in Berlin..."}'
          {...register('hero_copy_json')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Drives the city-specific hero text. Recognized keys: <code>events_description</code>, <code>hackathons_description</code>, <code>clubs_description</code>, <code>tagline_description</code>.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          {...register('enabled')}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="enabled" className="text-sm text-gray-700">
          Enabled (publicly visible at <code>{`{slug}.blau-tech.de`}</code>)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
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
