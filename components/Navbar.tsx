'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Events', href: '/dashboard/events' },
    { name: 'Hackathons', href: '/dashboard/hackathons' },
    { name: 'Scholarships', href: '/dashboard/scholarships' },
    { name: 'Student Clubs', href: '/dashboard/student-clubs' },
    { name: 'Signups', href: '/dashboard/signups' },
    { name: 'Link Tracking', href: '/dashboard/link-tracking' },
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
            <span className="text-sm text-gray-600">
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

