interface LinkedInPreviewCandidate {
  id?: string | number
  name?: string | null
  title?: string | null
  city?: string | null
  start_date?: string | null
  start_time?: string | null
  is_published?: boolean | null
  is_highlight?: boolean | null
  partner_event?: boolean | null
  posted_linkedin?: boolean | null
  drafted_linkedin?: boolean | null
}

export function selectLinkedInPreview(
  candidates: LinkedInPreviewCandidate[],
  city: string | null,
  today: string,
  limit: number
) {
  if (!city) return []

  return candidates
    .filter((item) =>
      item.city === city &&
      item.is_published === true &&
      !item.posted_linkedin &&
      !item.drafted_linkedin &&
      (item.start_date?.slice(0, 10) ?? '') > today
    )
    .sort((a, b) =>
      Number(Boolean(b.is_highlight)) - Number(Boolean(a.is_highlight)) ||
      Number(Boolean(b.partner_event)) - Number(Boolean(a.partner_event)) ||
      (a.start_date ?? '').localeCompare(b.start_date ?? '') ||
      (a.start_time ?? '\uffff').localeCompare(b.start_time ?? '\uffff') ||
      String(a.id ?? '').localeCompare(String(b.id ?? ''))
    )
    .slice(0, limit)
    .map((item) => ({
      id: item.id == null ? undefined : String(item.id),
      name: item.name || item.title || 'Untitled',
      start_date: item.start_date,
      city: item.city,
    }))
}
