'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import PartnerEventForm from '@/components/PartnerEventForm'
import { partnerEventsApi } from '@/lib/api'
import { format } from 'date-fns'

export default function PartnerEventsPage() {
  const [partnerEvents, setPartnerEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPartnerEvents()
  }, [])

  const loadPartnerEvents = async () => {
    try {
      setLoading(true)
      const data = await partnerEventsApi.fetch()
      setPartnerEvents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleDelete = async (event: any) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"?`)) {
      return
    }

    try {
      await partnerEventsApi.delete(event.id)
      await loadPartnerEvents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (editingEvent) {
        await partnerEventsApi.update(editingEvent.id, data)
      } else {
        await partnerEventsApi.create(data)
      }
      setIsModalOpen(false)
      setEditingEvent(null)
      await loadPartnerEvents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'date',
      label: 'Date',
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-',
    },
    {
      key: 'link',
      label: 'Link',
      render: (value: string) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 dark:text-primary-400">
          {value.length > 30 ? value.substring(0, 30) + '...' : value}
        </a>
      ) : '-',
    },
    {
      key: 'organiser',
      label: 'Organiser',
      render: (value: string) => value || '-',
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
        data={partnerEvents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add Partner Event"
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEvent(null)
        }}
        title={editingEvent ? 'Edit Partner Event' : 'Add Partner Event'}
      >
        <PartnerEventForm
          initialData={editingEvent}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingEvent(null)
          }}
          title={editingEvent ? 'Edit Partner Event' : 'Add Partner Event'}
        />
      </Modal>
    </Layout>
  )
}

