'use client'

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { supabase } from './supabase'

export interface City {
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
}

interface CityScopeValue {
  cities: City[]
  selectedCityId: number | null
  selectedCity: City | null
  setSelectedCityId: (id: number | null) => void
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const CityScopeContext = createContext<CityScopeValue | null>(null)
const STORAGE_KEY = 'blautech_admin_selected_city_id'

export function CityScopeProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([])
  const [selectedCityId, setSelectedCityIdState] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCities = async () => {
    setLoading(true)
    const { data, error: fetchErr } = await supabase
      .from('cities')
      .select('*')
      .order('name')
    if (fetchErr) {
      setError(fetchErr.message)
      setCities([])
    } else {
      setCities(data || [])
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    void fetchCities()
  }, [])

  // Restore selected city from localStorage; default to first city when nothing is stored.
  useEffect(() => {
    if (cities.length === 0) return
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    const storedId = stored ? Number(stored) : null
    const valid = storedId && cities.some((c) => c.id === storedId)
    setSelectedCityIdState(valid ? storedId : cities[0].id)
  }, [cities])

  const setSelectedCityId = (id: number | null) => {
    setSelectedCityIdState(id)
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(STORAGE_KEY, String(id))
      else window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) || null,
    [cities, selectedCityId],
  )

  const value = useMemo<CityScopeValue>(
    () => ({ cities, selectedCityId, selectedCity, setSelectedCityId, loading, error, refetch: fetchCities }),
    [cities, selectedCityId, selectedCity, loading, error],
  )

  return <CityScopeContext.Provider value={value}>{children}</CityScopeContext.Provider>
}

export function useCityScope() {
  const ctx = useContext(CityScopeContext)
  if (!ctx) throw new Error('useCityScope must be used within a CityScopeProvider')
  return ctx
}
