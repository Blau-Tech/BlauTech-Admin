'use client'

import { format } from 'date-fns'

interface HackathonDetailViewProps {
  hackathon: any
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export default function HackathonDetailView({ hackathon, onEdit, onDelete, onClose }: HackathonDetailViewProps) {
  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="text-gray-400 mt-0.5 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  )

  const calendarIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{hackathon.name || hackathon.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {hackathon.is_highlight && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Highlight
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-1">
        {/* Description */}
        {hackathon.description && (
          <InfoRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            }
            label="Description"
            value={<p className="text-gray-700 whitespace-pre-wrap">{hackathon.description}</p>}
          />
        )}

        {/* Start Date & Time */}
        <InfoRow
          icon={calendarIcon}
          label="Start Date & Time"
          value={
            <p className="font-medium">
              {hackathon.start_date ? format(new Date(hackathon.start_date), 'PP') : '-'}
              {hackathon.start_time && ` at ${hackathon.start_time}`}
            </p>
          }
        />

        {/* End Date & Time */}
        {hackathon.end_date && (
          <InfoRow
            icon={calendarIcon}
            label="End Date & Time"
            value={
              <p className="font-medium">
                {format(new Date(hackathon.end_date), 'PP')}
                {hackathon.end_time && ` at ${hackathon.end_time}`}
              </p>
            }
          />
        )}

        {/* Signup Deadline */}
        {hackathon.signup_deadline && (
          <InfoRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Signup Deadline"
            value={<p className="font-medium">{format(new Date(hackathon.signup_deadline), 'PP')}</p>}
          />
        )}

        {/* Prizes */}
        {hackathon.prizes && (
          <InfoRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Prizes"
            value={<p className="font-medium whitespace-pre-wrap">{hackathon.prizes}</p>}
          />
        )}

        {/* Location */}
        {hackathon.location && (
          <InfoRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Location"
            value={<p className="font-medium">{hackathon.location}</p>}
          />
        )}

        {/* Link */}
        {hackathon.link && (
          <InfoRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
            label="Hackathon Link"
            value={
              <a
                href={hackathon.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {hackathon.link}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            }
          />
        )}

        {/* Organisers */}
        {hackathon.organisers && (
          <InfoRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="Organisers"
            value={<p className="font-medium">{hackathon.organisers}</p>}
          />
        )}

        {/* Social Media Posting Status */}
        {(hackathon.posted_linkedin || hackathon.posted_whatsapp || hackathon.posted_newsletter) && (
          <InfoRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            }
            label="Social Media Posting"
            value={
              <div className="flex flex-wrap gap-2">
                {hackathon.posted_linkedin && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    LinkedIn
                  </span>
                )}
                {hackathon.posted_whatsapp && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    WhatsApp
                  </span>
                )}
                {hackathon.posted_newsletter && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    Newsletter
                  </span>
                )}
              </div>
            }
          />
        )}

        {/* Metadata */}
        <InfoRow
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Metadata"
          value={
            <div className="space-y-1 text-xs text-gray-500">
              <p>Created: {hackathon.created_at ? format(new Date(hackathon.created_at), 'PPp') : '-'}</p>
              {hackathon.updated_at && (
                <p>Last updated: {format(new Date(hackathon.updated_at), 'PPp')}</p>
              )}
            </div>
          }
        />
      </div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Edit Hackathon
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete Hackathon
        </button>
      </div>
    </div>
  )
}
