'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import EventForm from '@/components/EventForm'
import { scholarshipsApi } from '@/lib/api'
import { format } from 'date-fns'

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadScholarships()
  }, [])

  const loadScholarships = async () => {
    try {
      setLoading(true)
      const data = await scholarshipsApi.fetch()
      setScholarships(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingScholarship(null)
    setIsModalOpen(true)
  }

  const handleEdit = (scholarship: any) => {
    setEditingScholarship(scholarship)
    setIsModalOpen(true)
  }

  const handleDelete = async (scholarship: any) => {
    if (!confirm(`Are you sure you want to delete "${scholarship.title}"?`)) {
      return
    }

    try {
      await scholarshipsApi.delete(scholarship.id)
      await loadScholarships()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (editingScholarship) {
        await scholarshipsApi.update(editingScholarship.id, data)
      } else {
        await scholarshipsApi.create(data)
      }
      setIsModalOpen(false)
      setEditingScholarship(null)
      await loadScholarships()
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
        data={scholarships}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add Scholarship"
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingScholarship(null)
        }}
        title={editingScholarship ? 'Edit Scholarship' : 'Add Scholarship'}
      >
        <EventForm
          initialData={editingScholarship}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingScholarship(null)
          }}
          title={editingScholarship ? 'Edit Scholarship' : 'Add Scholarship'}
        />
      </Modal>
    </Layout>
  )
}

