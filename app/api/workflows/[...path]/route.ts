import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

  if (!baseUrl) {
    return NextResponse.json(
      { message: 'n8n webhook base URL is not configured.' },
      { status: 500 }
    )
  }

  const { path } = await context.params
  const webhookPath = path.join('/')
  const url = new URL(webhookPath, `${baseUrl.replace(/\/+$/, '')}/`)
  const body = await request.text()

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': request.headers.get('Content-Type') || 'application/json' },
      body,
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
