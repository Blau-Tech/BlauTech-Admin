import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  authorizeWorkflowRequest,
  getAccessClaims,
  isAllowedWorkflowPath,
  resolveN8nWorkflowPath,
} from '@/lib/authorization'

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  const webhookPath = path.join('/')

  if (!isAllowedWorkflowPath(webhookPath)) {
    return NextResponse.json({ message: 'Workflow not found.' }, { status: 404 })
  }

  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()

  if (!token) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ message: 'Invalid or expired session.' }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const decision = authorizeWorkflowRequest(webhookPath, payload, getAccessClaims(user))

  if (!decision.allowed) {
    return NextResponse.json({ message: decision.message }, { status: decision.status })
  }

  const city = (payload as Record<string, unknown>).city
  const n8nWebhookPath = resolveN8nWorkflowPath(webhookPath, city)

  const baseUrl = process.env.N8N_ADMIN_WEBHOOK_URL
  const webhookSecret = process.env.N8N_ADMIN_WEBHOOK_SECRET

  if (!baseUrl || !webhookSecret) {
    return NextResponse.json(
      { message: 'n8n Admin webhook is not configured.' },
      { status: 500 }
    )
  }

  const url = new URL(n8nWebhookPath, `${baseUrl.replace(/\/+$/, '')}/`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Blau-Admin-Secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    const contentType = response.headers.get('Content-Type') || 'application/json'

    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: { 'Content-Type': contentType },
    })
  } catch (error) {
    console.error('Error triggering n8n workflow:', error)

    return NextResponse.json(
      { message: 'Failed to reach n8n workflow.' },
      { status: 502 }
    )
  }
}
