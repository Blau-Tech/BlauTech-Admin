'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import EventForm from '@/components/EventForm'
import { hackathonsApi } from '@/lib/api'
import { format } from 'date-fns'

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHackathon, setEditingHackathon] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHackathons()
  }, [])

  const loadHackathons = async () => {
    try {
      setLoading(true)
      const data = await hackathonsApi.fetch()
      setHackathons(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingHackathon(null)
    setIsModalOpen(true)
  }

  const handleEdit = (hackathon: any) => {
    setEditingHackathon(hackathon)
    setIsModalOpen(true)
  }

  const handleDelete = async (hackathon: any) => {
    if (!confirm(`Are you sure you want to delete "${hackathon.title}"?`)) {
      return
    }

    try {
      await hackathonsApi.delete(hackathon.id)
      await loadHackathons()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (editingHackathon) {
        await hackathonsApi.update(editingHackathon.id, data)
      } else {
        await hackathonsApi.create(data)
      }
      setIsModalOpen(false)
      setEditingHackathon(null)
      await loadHackathons()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-',
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (value: string) => value ? format(new Date(value), 'PPp') : '-',
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (value: string) => format(new Date(value), 'PPp'),
    },
    {
      key: 'location',
      label: 'Location',
      render: (value: string) => value || '-',
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
        data={hackathons}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add Hackathon"
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingHackathon(null)
        }}
        title={editingHackathon ? 'Edit Hackathon' : 'Add Hackathon'}
      >
        <EventForm
          initialData={editingHackathon}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingHackathon(null)
          }}
          title={editingHackathon ? 'Edit Hackathon' : 'Add Hackathon'}
        />
      </Modal>
    </Layout>
  )
}

