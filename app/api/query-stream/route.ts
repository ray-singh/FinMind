import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runFinanceAgentStream } from '@/lib/agent'
import { getUserSettings } from '@/lib/db/queries'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { query } = await request.json()
  if (!query || typeof query !== 'string') {
    return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400 })
  }

  const userSettings = await getUserSettings(userId)
  const openaiApiKey = userSettings?.openaiApiKey || process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agentStream = runFinanceAgentStream(query, userId, openaiApiKey)
        for await (const step of agentStream) {
          const line = `data: ${JSON.stringify(step)}\n\n`
          controller.enqueue(encoder.encode(line))
        }
      } catch (err) {
        const errStep = { type: 'error', error: err instanceof Error ? err.message : String(err) }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errStep)}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
