'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function formatCity(city: string | null): string {
  if (!city) return ''
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
}

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut, isAdmin, isCityLead, userCity } = useAuth()

  const roleLabel = isAdmin
    ? 'Admin'
    : isCityLead
      ? `City Lead${userCity ? ` · ${formatCity(userCity)}` : ''}`
      : ''

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Events', href: '/dashboard/events' },
    { name: 'Hackathons', href: '/dashboard/hackathons' },
    { name: 'Scholarships', href: '/dashboard/scholarships' },
    { name: 'Opportunities', href: '/dashboard/opportunities' },
    { name: 'Organisations', href: '/dashboard/organisations' },
    { name: 'Link Tracking', href: '/dashboard/link-tracking' },
  ]

  return (
    <nav className="glass sticky top-0 z-40 border-b border-white/40 rounded-none">
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
            <div className="flex flex-col items-end leading-tight">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              {roleLabel && (
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ring-1 ring-inset ${
                    isAdmin
                      ? 'bg-primary-100/70 text-primary-700 ring-primary-200/60'
                      : 'bg-amber-100/70 text-amber-700 ring-amber-200/60'
                  }`}
                >
                  {roleLabel}
                </span>
              )}
            </div>
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

