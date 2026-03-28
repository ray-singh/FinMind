import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserSettings, upsertUserSettings } from '@/lib/db/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getUserSettings(userId)
  return NextResponse.json({
    hasOpenaiApiKey: !!settings?.openaiApiKey,
  })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { openaiApiKey } = await request.json()

  if (!openaiApiKey || typeof openaiApiKey !== 'string' || !openaiApiKey.startsWith('sk-')) {
    return NextResponse.json(
      { error: 'Invalid API key. It should start with "sk-".' },
      { status: 400 }
    )
  }

  await upsertUserSettings(userId, { openaiApiKey: openaiApiKey.trim() })
  return NextResponse.json({ success: true })
}
