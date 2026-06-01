'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import CityForm from '@/components/CityForm'
import { supabase } from '@/lib/supabase'
import { useCityScope } from '@/lib/cityScope'

interface CityRow {
  id: number
  slug: string
  name: string
  country: string
  timezone: string
  lang: string
  hero_copy: Record<string, any> | null
  lat: number | null
  lng: number | null
  enabled: boolean
  enabled_sections: string[]
  created_at: string
}

export default function CitiesPage() {
  const { refetch: refetchScope } = useCityScope()
  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<CityRow | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase.from('cities').select('*').order('name')
    if (err) {
      setError(err.message)
      setCities([])
    } else {
      setCities((data as CityRow[]) || [])
      setError('')
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const handleAdd = () => { setEditing(null); setIsModalOpen(true) }
  const handleEdit = (c: CityRow) => { setEditing(c); setIsModalOpen(true) }

  const handleSubmit = async (payload: any) => {
    setSuccess('')
    if (editing) {
      const { error: err } = await supabase
        .from('cities')
        .update({
          name: payload.name,
          country: payload.country,
          timezone: payload.timezone,
          lang: payload.lang,
          lat: payload.lat,
          lng: payload.lng,
          enabled: payload.enabled,
          enabled_sections: payload.enabled_sections,
          hero_copy: payload.hero_copy,
        })
        .eq('id', editing.id)
      if (err) throw new Error(err.message)
    } else {
      const { error: err } = await supabase.from('cities').insert(payload)
      if (err) {
        if (err.code === '23505') throw new Error(`Slug "${payload.slug}" already exists`)
        throw new Error(err.message)
      }
    }
    setIsModalOpen(false)
    setEditing(null)
    setSuccess(editing ? `Updated ${payload.name}` : `Created ${payload.name}`)
    await load()
    await refetchScope()
  }

  const handleToggleEnabled = async (c: CityRow) => {
    const { error: err } = await supabase
      .from('cities')
      .update({ enabled: !c.enabled })
      .eq('id', c.id)
    if (err) {
      setError(err.message)
      return
    }
    await load()
    await refetchScope()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cities</h1>
            <p className="text-sm text-gray-600 mt-1">
              Each city becomes a subdomain at <code className="text-xs">{`{slug}.blau-tech.de`}</code>.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            + Add City
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : cities.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No cities yet. Click <strong>Add City</strong> to create the first one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Slug</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Country</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Timezone</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cities.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{c.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.country}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.timezone}</td>
                    <td className="px-4 py-3 text-sm">
                      {c.enabled ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">live</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">disabled</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                      <a
                        href={`https://${c.slug}.blau-tech.de`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Visit
                      </a>
                      <button
                        onClick={() => handleToggleEnabled(c)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {c.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null) }}>
          <CityForm
            initialData={editing}
            isEdit={!!editing}
            title={editing ? `Edit ${editing.name}` : 'Add a new city'}
            onSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); setEditing(null) }}
          />
        </Modal>
      </div>
    </Layout>
  )
}
