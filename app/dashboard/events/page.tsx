'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import EventForm from '@/components/EventForm'
import { eventsApi } from '@/lib/api'
import { format } from 'date-fns'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await eventsApi.fetch()
      setEvents(data)
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
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return
    }

    try {
      await eventsApi.delete(event.id)
      await loadEvents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, data)
      } else {
        await eventsApi.create(data)
      }
      setIsModalOpen(false)
      setEditingEvent(null)
      await loadEvents()
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
        data={events}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add Event"
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEvent(null)
        }}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
      >
        <EventForm
          initialData={editingEvent}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingEvent(null)
          }}
          title={editingEvent ? 'Edit Event' : 'Add Event'}
        />
      </Modal>
    </Layout>
  )
}

