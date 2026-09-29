import { supabase } from './supabase'

export type ProgramReview = {
  id: string
  opportunity_id: string | null
  source_url: string
  proposed_listing: Record<string, any>
  base_listing?: Record<string, any> | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  version: number
  verified_at: string | null
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
}

export type ReviewDecision = {
  action: 'SAVE' | 'APPROVE' | 'REJECT'
  reason?: string
  officialPageChecked?: boolean
  newApplicationRound?: boolean
}

export const programReviewsApi = {
  async fetch(status: ProgramReview['status'] = 'PENDING'): Promise<ProgramReview[]> {
    const { data, error } = await supabase.from('program_reviews')
      .select('*').eq('status', status).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async submit(listing: Record<string, any>, opportunityId: string | null = null) {
    const { data, error } = await supabase.rpc('submit_program_review', {
      p_listing: { ...listing, content_type: 'PROGRAM', clean_url: listing.clean_url || listing.url },
      p_opportunity_id: opportunityId,
    })
    if (error) throw error
    return Array.isArray(data) ? data[0] : data
  },

  async decide(review: ProgramReview, listing: Record<string, any>, decision: ReviewDecision) {
    const { data, error } = await supabase.rpc('decide_program_review', {
      p_review_id: review.id,
      p_expected_version: review.version,
      p_decision: decision.action,
      p_listing: decision.action === 'REJECT' ? null : listing,
      p_reason: decision.reason?.trim() || null,
      p_official_page_checked: decision.officialPageChecked === true,
      p_new_application_round: decision.newApplicationRound === true,
    })
    if (error) throw error
    return Array.isArray(data) ? data[0] : data
  },
}
