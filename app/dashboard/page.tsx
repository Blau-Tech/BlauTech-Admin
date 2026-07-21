'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import Layout from '@/components/Layout'
import Link from 'next/link'
import Calendar from '@/components/Calendar'
import GlassCard from '@/components/ui/GlassCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmModal from '@/components/ui/ConfirmModal'
import {
  dashboardStats,
  eventsApi,
  hackathonsApi,
  scholarshipsApi,
  triggerWorkflow,
} from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { resolveWorkflowCity, type CityCode } from '@/lib/authorization'
import { selectLinkedInPreview } from '@/lib/linkedinPreview'
import { format } from 'date-fns'

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
  const { isAdmin, isCityLead, userCity, loading: authLoading } = useAuth()
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
  const [pendingWorkflow, setPendingWorkflow] = useState<'events-linkedin' | 'hackathons-linkedin' | 'newsletter' | null>(null)
  const [selectedWorkflowCity, setSelectedWorkflowCity] = useState<CityCode | null>(null)
  const workflowCity = resolveWorkflowCity(isCityLead, userCity, selectedWorkflowCity)

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

  const confirmWorkflow = async (testMode: boolean) => {
    const label =
      pendingWorkflow === 'events-linkedin' ? 'Events LinkedIn draft' :
      pendingWorkflow === 'hackathons-linkedin' ? 'Hackathons LinkedIn draft' :
      'Newsletter draft'

    if (pendingWorkflow !== 'newsletter' && !workflowCity) {
      toast.error('Please select a city.')
      return
    }

    const toastId = toast.loading(`Generating ${label}…`)
    try {
      if (pendingWorkflow === 'events-linkedin') {
        await triggerWorkflow('blau-network-linkedin-events', { city: workflowCity, test_mode: testMode })
      } else if (pendingWorkflow === 'hackathons-linkedin') {
        await triggerWorkflow('blau-network-linkedin-hackathons', { city: workflowCity, test_mode: testMode })
      } else if (pendingWorkflow === 'newsletter') {
        await triggerWorkflow('blau-network-newsletter', { test_mode: testMode })
      }
      toast.success(
        testMode
          ? `${label} test started. The preview will appear in n8n execution history.`
          : `${label} live generation started!`,
        { id: toastId }
      )
    } catch (err: any) {
      toast.error(`Failed to generate ${label}`, {
        id: toastId,
        description: err.message || 'Something went wrong. Please try again.',
      })
    } finally {
      setPendingWorkflow(null)
      setSelectedWorkflowCity(null)
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

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const eventsLinkedInPreview = useMemo(() => {
    return selectLinkedInPreview(calendarEvents, workflowCity, today, 4)
  }, [calendarEvents, today, workflowCity])

  const hackathonsLinkedInPreview = useMemo(() => {
    return selectLinkedInPreview(calendarHackathons, workflowCity, today, 2)
  }, [calendarHackathons, today, workflowCity])

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPendingWorkflow('events-linkedin')}
                className="flex items-center gap-2 rounded-xl bg-[#0077B5]/90 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#005f8e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0077B5] transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Events — Generate LinkedIn Draft
              </button>
              <button
                type="button"
                onClick={() => setPendingWorkflow('hackathons-linkedin')}
                className="flex items-center gap-2 rounded-xl bg-[#0077B5]/90 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#005f8e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0077B5] transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Hackathons — Generate LinkedIn Draft
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setPendingWorkflow('newsletter')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600/90 to-purple-600/90 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-violet-700 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Generate Newsletter Draft
                </button>
              )}
          </div>
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

      <ConfirmModal
        isOpen={pendingWorkflow === 'events-linkedin'}
        title="Generate Events LinkedIn Draft"
        info="The next 4 eligible upcoming events are suggested. Highlights and partner events are prioritised, then the closest start date."
        checklist={[
          'Review the suggested events before generating the draft.',
        ]}
        previewItems={workflowCity ? eventsLinkedInPreview : undefined}
        previewLabel="Suggested events"
        city={workflowCity}
        onCityChange={isAdmin ? setSelectedWorkflowCity : undefined}
        onConfirm={confirmWorkflow}
        onCancel={() => {
          setPendingWorkflow(null)
          setSelectedWorkflowCity(null)
        }}
      />

      <ConfirmModal
        isOpen={pendingWorkflow === 'hackathons-linkedin'}
        title="Generate Hackathons LinkedIn Draft"
        info="The next 2 eligible upcoming hackathons are suggested. Highlights and partner events are prioritised, then the closest start date."
        checklist={[
          'Review the suggested hackathons before generating the draft.',
        ]}
        previewItems={workflowCity ? hackathonsLinkedInPreview : undefined}
        previewLabel="Suggested hackathons"
        city={workflowCity}
        onCityChange={isAdmin ? setSelectedWorkflowCity : undefined}
        onConfirm={confirmWorkflow}
        onCancel={() => {
          setPendingWorkflow(null)
          setSelectedWorkflowCity(null)
        }}
      />

      <ConfirmModal
        isOpen={pendingWorkflow === 'newsletter'}
        title="Generate Newsletter Draft"
        checklist={[
          'Have you highlighted the events to include in the newsletter?',
          'Have you highlighted the hackathons to include in the newsletter?',
        ]}
        onConfirm={confirmWorkflow}
        onCancel={() => setPendingWorkflow(null)}
      />
    </Layout>
  )
}
