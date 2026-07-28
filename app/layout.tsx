import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BlauTech Admin Panel',
  description: 'Admin panel for managing BlauTech events, hackathons, and scholarships',
}

const isPreview = process.env.NEXT_PUBLIC_APP_ENV === 'preview'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {isPreview && (
          <div className="bg-amber-300 px-4 py-2 text-center text-sm font-semibold text-amber-950">
            Preview environment — test data and workflows only
          </div>
        )}
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
