'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import DataTable from '@/components/DataTable'
import { signupsApi } from '@/lib/api'
import { format } from 'date-fns'

export default function SignupsPage() {
  const [signups, setSignups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSignups()
  }, [])

  const loadSignups = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await signupsApi.fetch()
      console.log('Signups data:', data) // Debug log
      setSignups(data || [])
      if (data && data.length === 0) {
        console.warn('Signups table is empty or no data returned')
      }
    } catch (err: any) {
      console.error('Error loading signups:', err)
      setError(err.message || 'Failed to load signups. Check browser console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (signup: any) => {
    if (!confirm(`Are you sure you want to delete signup for "${signup.full_name}"?`)) {
      return
    }

    try {
      await signupsApi.delete(signup.id)
      await loadSignups()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const columns = [
    {
      key: 'full_name',
      label: 'Full Name',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value: string) => value || '-',
    },
    {
      key: 'referral',
      label: 'Referral',
      render: (value: string) => value || '-',
    },
    {
      key: 'consent',
      label: 'Consent',
      render: (value: boolean) => value ? 'Yes' : 'No',
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (value: string) => format(new Date(value), 'PPp'),
    },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      <DataTable
        columns={columns}
        data={signups}
        onDelete={handleDelete}
      />
    </Layout>
  )
}

