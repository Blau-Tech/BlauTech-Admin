'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCityScope } from '@/lib/cityScope'

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { cities, selectedCityId, setSelectedCityId, loading } = useCityScope()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Events', href: '/dashboard/events' },
    { name: 'Hackathons', href: '/dashboard/hackathons' },
    { name: 'Scholarships', href: '/dashboard/scholarships' },
    { name: 'Student Clubs', href: '/dashboard/student-clubs' },
    { name: 'Link Tracking', href: '/dashboard/link-tracking' },
    { name: 'Cities', href: '/dashboard/cities' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary-600">
                BlauTech Admin
              </h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCityId ?? ''}
              onChange={(e) => setSelectedCityId(e.target.value ? Number(e.target.value) : null)}
              disabled={loading || cities.length === 0}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100"
              aria-label="Active city"
            >
              {cities.length === 0 && <option value="">No cities</option>}
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.enabled ? ' (disabled)' : ''}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

