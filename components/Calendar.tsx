'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'

interface CalendarItem {
  id: number
  name?: string
  title?: string // Fallback for backward compatibility
  start_date: string
  end_date?: string
  type: 'event' | 'hackathon' | 'scholarship'
}

interface CalendarProps {
  events: CalendarItem[]
  hackathons: CalendarItem[]
  scholarships: CalendarItem[]
}

export default function Calendar({ events, hackathons, scholarships }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const allItems = useMemo(() => {
    return [
      ...events.map(e => ({ ...e, type: 'event' as const })),
      ...hackathons.map(h => ({ ...h, type: 'hackathon' as const })),
      ...scholarships.map(s => ({ ...s, type: 'scholarship' as const })),
    ]
  }, [events, hackathons, scholarships])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getItemsForDate = (date: Date) => {
    return allItems.filter(item => {
      const itemStart = new Date(item.start_date)
      const itemEnd = item.end_date ? new Date(item.end_date) : itemStart
      
      return (
        isSameDay(itemStart, date) ||
        isSameDay(itemEnd, date) ||
        (date >= itemStart && date <= itemEnd)
      )
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-blue-500 text-white'
      case 'hackathon':
        return 'bg-green-500 text-white'
      case 'scholarship':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'event':
        return 'Event'
      case 'hackathon':
        return 'Hackathon'
      case 'scholarship':
        return 'Scholarship'
      default:
        return ''
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="glass rounded-3xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-100/70 backdrop-blur-sm rounded-xl hover:bg-primary-100 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600">Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Hackathons</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-sm text-gray-600">Scholarships</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, idx) => {
          const dayItems = getItemsForDate(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={idx}
              className={`min-h-[80px] p-1 border rounded-xl backdrop-blur-sm transition-colors ${
                isCurrentMonth
                  ? 'bg-white/40 border-white/40'
                  : 'bg-white/15 border-white/20'
              } ${isToday ? 'ring-2 ring-primary-500/60' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday ? 'text-primary-600' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 2).map((item) => {
                  const itemTitle = item.name || item.title || 'Untitled'
                  return (
                    <div
                      key={item.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${getTypeColor(item.type)}`}
                      title={itemTitle}
                    >
                      {itemTitle.length > 15 ? itemTitle.substring(0, 15) + '...' : itemTitle}
                    </div>
                  )
                })}
                {dayItems.length > 2 && (
                  <div className="text-xs text-gray-500 px-1.5">
                    +{dayItems.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upcoming Items List */}
      {allItems.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/40">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allItems
              .filter(item => {
                const itemDate = new Date(item.start_date)
                return itemDate >= new Date()
              })
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .slice(0, 10)
              .map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getTypeColor(item.type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getTypeColor(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(item.start_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{item.name || item.title || 'Untitled'}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

