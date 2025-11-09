'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { dashboardStats } from '@/lib/api'

// SVG Icons
const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const CodeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

const GraduationIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M5 19.5l9-5M15 19.5l-9-5" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const LinkIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

interface StatCard {
  name: string
  href: string
  icon: React.ReactNode
  gradient: string
  bgColor: string
  textColor: string
  borderColor: string
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    events: 0,
    hackathons: 0,
    scholarships: 0,
    signups: 0,
    partnerEvents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [events, hackathons, scholarships, signups, partnerEvents] = await Promise.all([
        dashboardStats.getEventsCount(),
        dashboardStats.getHackathonsCount(),
        dashboardStats.getScholarshipsCount(),
        dashboardStats.getSignupsCount(),
        dashboardStats.getPartnerEventsCount(),
      ])
      setStats({ events, hackathons, scholarships, signups, partnerEvents })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards: StatCard[] = [
    {
      name: 'Events',
      href: '/dashboard/events',
      icon: <CalendarIcon />,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      name: 'Hackathons',
      href: '/dashboard/hackathons',
      icon: <CodeIcon />,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      name: 'Scholarships',
      href: '/dashboard/scholarships',
      icon: <GraduationIcon />,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      name: 'Signups',
      href: '/dashboard/signups',
      icon: <UsersIcon />,
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      name: 'Partner Events',
      href: '/dashboard/partner-events',
      icon: <LinkIcon />,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
  ]

  const getCount = (name: string): number => {
    switch (name) {
      case 'Events':
        return stats.events
      case 'Hackathons':
        return stats.hackathons
      case 'Scholarships':
        return stats.scholarships
      case 'Signups':
        return stats.signups
      case 'Partner Events':
        return stats.partnerEvents
      default:
        return 0
    }
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to BlauTech Admin
          </h1>
          <p className="text-lg text-gray-600">
            Manage your events, hackathons, scholarships, and more
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {statCards.map((card) => {
            const count = getCount(card.name)
            return (
              <Link
                key={card.name}
                href={card.href}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border-2 border-gray-100 hover:shadow-xl hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {card.name}
                    </p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <p className="text-4xl font-bold text-gray-900 mb-1">
                        {count}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {card.name === 'Signups' ? 'Total registrations' : 'Active items'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700">
                  Manage
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
