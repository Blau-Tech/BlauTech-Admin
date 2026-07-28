const LINKEDIN_HOSTS = new Set([
  'linkedin.com',
  'www.linkedin.com',
  'm.linkedin.com',
  'de.linkedin.com',
])

export function canonicalizeLinkedInPostUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('Enter a valid LinkedIn post URL.')
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !LINKEDIN_HOSTS.has(url.hostname.toLowerCase())
  ) {
    throw new Error('Only public HTTPS LinkedIn post URLs are supported.')
  }

  const path = url.pathname.replace(/\/+$/, '')
  const activity = path.match(/^\/feed\/update\/urn:li:activity:(\d+)$/i)
  const post = path.match(/^\/posts\/[^/]+$/i)
  if (!activity && !post) {
    throw new Error('Use a LinkedIn /posts/ or activity update URL.')
  }

  return `https://www.linkedin.com${activity
    ? `/feed/update/urn:li:activity:${activity[1]}`
    : path}`
}
