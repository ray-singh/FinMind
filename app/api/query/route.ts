import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runFinanceAgent } from '@/lib/agent'
import { getUserSettings } from '@/lib/db/queries'
import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' })

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { query, useAgent = true } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Resolve API key: user-stored key takes priority, fall back to env var
    const userSettings = await getUserSettings(userId)
    const openaiApiKey = userSettings?.openaiApiKey || process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          message: 'Please add your OpenAI API key in the dashboard settings.',
        },
        { status: 500 }
      )
    }

    // Use the LangGraph-based finance agent with user isolation
    if (useAgent) {
      const agentResult = await runFinanceAgent(query, userId, openaiApiKey)
      
      return NextResponse.json({
        query,
        sql: agentResult.executedSQL || null,
        results: agentResult.queryResults || [],
        response: agentResult.response,
        resultCount: agentResult.queryResults?.length || 0,
        chartData: agentResult.chartData,
        // Agent-specific metadata
        agentMode: true,
        toolsUsed: agentResult.toolsUsed,
      })
    }

    // Fallback to legacy text-to-SQL (kept for backward compatibility)
    const { textToSQL, generateNaturalLanguageResponse } = await import('@/lib/textToSQL')
    const { sql, results, chartData, error } = await textToSQL(query, userId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to process query', details: error },
        { status: 500 }
      )
    }

    const nlResponse = await generateNaturalLanguageResponse(query, sql, results)

    return NextResponse.json({
      query,
      sql,
      results,
      response: nlResponse,
      resultCount: results.length,
      chartData,
      agentMode: false,
    })
  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json(
      { error: 'Failed to process query', details: String(error) },
      { status: 500 }
    )
  }
}
