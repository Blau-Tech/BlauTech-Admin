'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import Calendar from '@/components/Calendar'
import GlassCard from '@/components/ui/GlassCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  dashboardStats,
  eventsApi,
  hackathonsApi,
  scholarshipsApi,
} from '@/lib/api'
import { useAuth } from '@/lib/auth'

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

const SparklesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0v-3m-7-3h2m-2 3h2m-4-3h2m-2 3h2M9 7h2m-2 3h2m-2 3h2" />
  </svg>
)

interface StatCard {
  name: string
  href: string
  icon: React.ReactNode
  gradient: string
}

export default function Dashboard() {
  const { isCityLead, userCity, loading: authLoading } = useAuth()
  const cityFilter = isCityLead ? userCity ?? undefined : undefined

  const [stats, setStats] = useState({
    events: 0,
    hackathons: 0,
    scholarships: 0,
    opportunities: 0,
    organisations: 0,
  })
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [calendarHackathons, setCalendarHackathons] = useState<any[]>([])
  const [calendarScholarships, setCalendarScholarships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    loadStats()
    loadCalendarData()
  }, [authLoading, cityFilter])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [events, hackathons, scholarships, opportunities, organisations] = await Promise.all([
        dashboardStats.getEventsCount(cityFilter),
        dashboardStats.getHackathonsCount(cityFilter),
        dashboardStats.getScholarshipsCount(cityFilter),
        dashboardStats.getOpportunitiesCount(cityFilter),
        dashboardStats.getOrganisationsCount(cityFilter),
      ])
      setStats({ events, hackathons, scholarships, opportunities, organisations })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendarData = async () => {
    try {
      setCalendarLoading(true)
      const [events, hackathons, scholarships] = await Promise.all([
        eventsApi.fetch(cityFilter),
        hackathonsApi.fetch(cityFilter),
        scholarshipsApi.fetch(cityFilter),
      ])

      setCalendarEvents(events.filter((e: any) => e.start_date))
      setCalendarHackathons(hackathons.filter((h: any) => h.start_date))
      // Scholarships only have `deadline` in the new schema — show that on the calendar.
      setCalendarScholarships(
        scholarships
          .filter((s: any) => s.deadline)
          .map((s: any) => ({ ...s, start_date: s.deadline }))
      )
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setCalendarLoading(false)
    }
  }

  const statCards: StatCard[] = [
    {
      name: 'Events',
      href: '/dashboard/events',
      icon: <CalendarIcon />,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Hackathons',
      href: '/dashboard/hackathons',
      icon: <CodeIcon />,
      gradient: 'from-green-500 to-green-600',
    },
    {
      name: 'Scholarships',
      href: '/dashboard/scholarships',
      icon: <GraduationIcon />,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Opportunities',
      href: '/dashboard/opportunities',
      icon: <SparklesIcon />,
      gradient: 'from-pink-500 to-pink-600',
    },
    {
      name: 'Organisations',
      href: '/dashboard/organisations',
      icon: <BuildingIcon />,
      gradient: 'from-amber-500 to-amber-600',
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
      case 'Opportunities':
        return stats.opportunities
      case 'Organisations':
        return stats.organisations
      default:
        return 0
    }
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to BlauTech Admin
          </h1>
          <p className="text-lg text-gray-600">
            {isCityLead && userCity
              ? `Showing data for your city: ${userCity.charAt(0) + userCity.slice(1).toLowerCase()}`
              : 'Manage your events, hackathons, scholarships, opportunities and organisations'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {statCards.map((card) => {
            const count = getCount(card.name)
            return (
              <Link
                key={card.name}
                href={card.href}
                className="block"
              >
                <GlassCard className="group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white/70 h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {card.name}
                      </p>
                      {loading ? (
                        <div className="h-10 w-20 bg-white/40 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-4xl font-bold text-gray-900 mb-1">{count}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">Active items</p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700">
                    Manage
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </GlassCard>
              </Link>
            )
          })}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events Calendar</h2>
          {calendarLoading ? (
            <GlassCard className="p-12">
              <LoadingSpinner label="Loading calendar..." />
            </GlassCard>
          ) : (
            <Calendar
              events={calendarEvents}
              hackathons={calendarHackathons}
              scholarships={calendarScholarships}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}
