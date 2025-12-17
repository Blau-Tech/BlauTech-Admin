'use client'

import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import StudentClubForm from '@/components/StudentClubForm'
import { studentClubsApi } from '@/lib/api'

type StudentClub = {
  id: number
  name: string
  description: string
  link: string
  universities: string[] | null
  topics: string[] | null
  created_at: string
}

export default function StudentClubsPage() {
  const [clubs, setClubs] = useState<StudentClub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [searchQuery, setSearchQuery] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<StudentClub | null>(null)

  // Link submission state
  const [clubLink, setClubLink] = useState('')
  const [webhookLoading, setWebhookLoading] = useState(false)

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clubLink.trim()) return

    try {
      setWebhookLoading(true)
      setError('')

      const url = 'https://troyrivera.app.n8n.cloud/webhook/22dc92e9-366b-41c1-9d88-35ea11552292'

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: clubLink.trim() }),
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.statusText}`)
      }

      setSuccessMessage('Club link sent successfully!')
      setClubLink('')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to send webhook request')
    } finally {
      setWebhookLoading(false)
    }
  }

  useEffect(() => {
    loadClubs()
  }, [])

  const loadClubs = async () => {
    try {
      setLoading(true)
      const data = await studentClubsApi.fetch()
      setClubs(data as StudentClub[])
    } catch (err: any) {
      setError(err.message || 'Failed to load student clubs')
    } finally {
      setLoading(false)
    }
  }

  const filteredClubs = useMemo(() => {
    if (!searchQuery.trim()) return clubs
    const q = searchQuery.toLowerCase()
    return clubs.filter((club) => {
      const name = (club.name || '').toLowerCase()
      const description = (club.description || '').toLowerCase()
      const link = (club.link || '').toLowerCase()
      const universities = (club.universities || []).join(', ').toLowerCase()
      const topics = (club.topics || []).join(', ').toLowerCase()
      return (
        name.includes(q) ||
        description.includes(q) ||
        link.includes(q) ||
        universities.includes(q) ||
        topics.includes(q)
      )
    })
  }, [clubs, searchQuery])

  const handleAdd = () => {
    setEditingClub(null)
    setIsModalOpen(true)
  }

  const handleEdit = (club: StudentClub) => {
    setEditingClub(club)
    setIsModalOpen(true)
  }

  const handleDelete = async (club: StudentClub) => {
    if (!confirm(`Are you sure you want to delete "${club.name}"?`)) return
    try {
      setError('')
      await studentClubsApi.delete(club.id)
      await loadClubs()
      setSuccessMessage('Student club deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete student club')
    }
  }

  const handleSubmit = async (data: {
    name: string
    description: string
    link: string
    universities: string[] | null
    topics: string[] | null
  }) => {
    setError('')
    setSuccessMessage('')

    if (editingClub) {
      await studentClubsApi.update(editingClub.id, data)
      setSuccessMessage('Student club updated successfully!')
    } else {
      await studentClubsApi.create(data)
      setSuccessMessage('Student club created successfully!')
    }

    setTimeout(() => {
      setIsModalOpen(false)
      setEditingClub(null)
      setSuccessMessage('')
      loadClubs()
    }, 800)
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button onClick={() => setError('')} className="inline-flex text-red-400 hover:text-red-600">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Student Clubs</h1>
            {filteredClubs.length !== clubs.length && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredClubs.length} of {clubs.length} clubs
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="block rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              Add Club
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search clubs by name, description, university, topic, or link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Webhook URL Input */}
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-2xl">
            <form onSubmit={handleWebhookSubmit} className="flex items-center gap-3">
              <input
                type="url"
                placeholder="Enter club link URL..."
                value={clubLink}
                onChange={(e) => setClubLink(e.target.value)}
                className="flex-1 text-base px-4 py-3 border-2 border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                disabled={webhookLoading}
              />
              <button
                type="submit"
                disabled={!clubLink.trim() || webhookLoading}
                className="px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {webhookLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {filteredClubs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">
              {clubs.length === 0 ? 'No student clubs yet' : 'No clubs match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="mt-4 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow-sm ring-1 ring-gray-200 rounded-xl bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Name
                        </th>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                          Universities
                        </th>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                          Topics
                        </th>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                          Link
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredClubs.map((club) => (
                        <tr key={club.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                            <div className="font-medium text-gray-900">{club.name || '-'}</div>
                            {club.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-1">{club.description}</div>
                            )}
                          </td>
                          <td className="py-4 pl-4 pr-3 text-sm text-gray-700">
                            {(club.universities && club.universities.length) ? club.universities.join(', ') : '-'}
                          </td>
                          <td className="py-4 pl-4 pr-3 text-sm text-gray-700">
                            {(club.topics && club.topics.length) ? club.topics.join(', ') : '-'}
                          </td>
                          <td className="py-4 pl-4 pr-3 text-sm text-gray-700">
                            {club.link ? (
                              <a
                                href={club.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1"
                              >
                                Visit
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-4">
                              <button
                                onClick={() => handleEdit(club)}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(club)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingClub(null)
          setError('')
        }}
        title={editingClub ? 'Edit Student Club' : 'Add Student Club'}
      >
        <StudentClubForm
          initialData={editingClub}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingClub(null)
            setError('')
          }}
          title={editingClub ? 'Edit Student Club' : 'Add Student Club'}
        />
      </Modal>
    </Layout>
  )
}

