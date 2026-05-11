'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

function formatCity(city: string | null): string {
  if (!city) return ''
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
}

function getInitials(email: string | null | undefined): string {
  if (!email) return '?'
  const local = email.split('@')[0]
  const parts = local.split(/[._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Events', href: '/dashboard/events' },
  { name: 'Hackathons', href: '/dashboard/hackathons' },
  { name: 'Scholarships', href: '/dashboard/scholarships' },
  { name: 'Opportunities', href: '/dashboard/opportunities' },
  { name: 'Organisations', href: '/dashboard/organisations' },
  { name: 'Links', href: '/dashboard/link-tracking' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut, isAdmin, isCityLead, userCity } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const roleLabel = isAdmin
    ? 'Admin'
    : isCityLead
      ? `City Lead${userCity ? ` · ${formatCity(userCity)}` : ''}`
      : ''

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.60)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.50)',
          boxShadow: '0 4px 24px -8px rgba(15,23,42,0.10), inset 0 1px 0 0 rgba(255,255,255,0.65)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Brand */}
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="text-base font-bold text-primary-600 tracking-tight">
                BlauTech
                <span className="ml-1 text-xs font-semibold text-gray-400 tracking-widest uppercase">Admin</span>
              </Link>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'text-primary-700 bg-primary-50/80'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full bg-primary-500/80" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right side: role badge + avatar dropdown */}
            <div className="flex items-center gap-3">
              {roleLabel && (
                <span
                  className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset backdrop-blur-sm ${
                    isAdmin
                      ? 'bg-primary-100/70 text-primary-700 ring-primary-200/60'
                      : 'bg-amber-100/70 text-amber-700 ring-amber-200/60'
                  }`}
                >
                  {roleLabel}
                </span>
              )}

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white ring-2 ring-white/80 shadow-md transition-transform hover:scale-105 focus:outline-none"
                  style={{
                    background: isAdmin
                      ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  }}
                  aria-label="Account menu"
                >
                  {getInitials(user?.email)}
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 16px 40px -8px rgba(15,23,42,0.18), inset 0 1px 0 0 rgba(255,255,255,0.7)',
                    }}
                  >
                    <div className="px-4 py-3 border-b border-gray-100/80">
                      <p className="text-xs text-gray-400 mb-0.5">Signed in as</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                      {roleLabel && (
                        <span
                          className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                            isAdmin
                              ? 'bg-primary-100/70 text-primary-700 ring-primary-200/60'
                              : 'bg-amber-100/70 text-amber-700 ring-amber-200/60'
                          }`}
                        >
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setMenuOpen(false); signOut() }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50/70 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded-md hover:bg-white/50 transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                <span className={`block w-4.5 h-0.5 bg-gray-600 rounded-full transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-4.5 h-0.5 bg-gray-600 rounded-full transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-4.5 h-0.5 bg-gray-600 rounded-full transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t border-white/40"
            style={{
              background: 'rgba(255,255,255,0.70)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div className="px-3 py-2 space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50/80 text-primary-700'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
