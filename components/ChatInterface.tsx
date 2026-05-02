'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Code2, Table, Cpu, Wrench, ChevronDown, ChevronRight } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChartData } from '@/types'

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

// Human-friendly labels for tool names
const TOOL_LABELS: Record<string, string> = {
  sql_query: 'Running SQL query',
  get_categories: 'Fetching categories',
  get_financial_summary: 'Summarizing finances',
  get_monthly_trends: 'Analyzing trends',
  search_transactions: 'Searching transactions',
  compare_periods: 'Comparing periods',
  retrieve_context: 'Retrieving context',
  find_similar_transactions: 'Finding similar transactions',
  preview_categorization: 'Previewing categorization',
  recategorize_transactions: 'Recategorizing',
  learn_category: 'Learning category rule',
  detect_anomalies: 'Detecting anomalies',
  remember_preference: 'Saving preference',
  recall_preferences: 'Recalling preferences',
}

interface ThinkingStep {
  tool: string
  input: string
  result?: string
  status: 'running' | 'done'
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  sql?: string
  results?: unknown[]
  chartData?: ChartData
  timestamp: Date
  agentMode?: boolean
  toolsUsed?: string[]
  thinkingSteps?: ThinkingStep[]
  // Set while the assistant message is still streaming
  streaming?: boolean
}

function MessageChart({ chartData }: { chartData: ChartData }) {
  if (!chartData || !chartData.data || chartData.data.length === 0) return null

  const firstItem = chartData.data[0]
  const dataKey =
    chartData.dataKey ||
    (firstItem.value !== undefined
      ? 'value'
      : Object.keys(firstItem).find((k) => typeof firstItem[k] === 'number') || 'value')
  const nameKey =
    chartData.nameKey ||
    (firstItem.name !== undefined
      ? 'name'
      : Object.keys(firstItem).find((k) => typeof firstItem[k] === 'string') || 'name')

  return (
    <div className="mt-3 bg-white rounded-lg p-4 border">
      {chartData.title && (
        <h4 className="text-sm font-medium text-gray-700 mb-2">{chartData.title}</h4>
      )}
      <ResponsiveContainer width="100%" height={200}>
        {chartData.type === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData.data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={(entry) => entry[nameKey]}
            >
              {chartData.data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | string) =>
                typeof value === 'number' ? `$${value.toFixed(2)}` : value
              }
            />
          </PieChart>
        ) : chartData.type === 'line' ? (
          <LineChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              formatter={(value: number | string) =>
                typeof value === 'number' ? `$${value.toFixed(2)}` : value
              }
            />
            <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} />
            {chartData.data[0]?.income !== undefined && (
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
            )}
          </LineChart>
        ) : (
          <BarChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} fontSize={12} angle={-45} textAnchor="end" height={60} />
            <YAxis fontSize={12} />
            <Tooltip
              formatter={(value: number | string) =>
                typeof value === 'number' ? `$${value.toFixed(2)}` : value
              }
            />
            <Bar dataKey={dataKey} fill="#3b82f6" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function ResultsTable({ results }: { results: unknown[] }) {
  if (!results || results.length === 0) return null

  const rows = results as Record<string, unknown>[]
  const columns = Object.keys(rows[0])
  const displayResults = rows.slice(0, 10)

  return (
    <div className="mt-3 bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto max-h-48">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-gray-600">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayResults.map((row, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-gray-800">
                    {typeof row[col] === 'number'
                      ? (row[col] as number).toFixed(2)
                      : String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-t">
          Showing 10 of {rows.length} results
        </div>
      )}
    </div>
  )
}

function ThinkingStepsPanel({ steps, streaming }: { steps: ThinkingStep[]; streaming: boolean }) {
  const [expanded, setExpanded] = useState(true)

  if (steps.length === 0 && !streaming) return null

  return (
    <div className="mt-2 border border-purple-100 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Cpu size={11} />
          Agent reasoning
          {streaming && steps.length === 0 && (
            <span className="ml-1 flex gap-0.5">
              <span className="animate-bounce delay-0 w-1 h-1 bg-purple-400 rounded-full" />
              <span className="animate-bounce delay-75 w-1 h-1 bg-purple-400 rounded-full" />
              <span className="animate-bounce delay-150 w-1 h-1 bg-purple-400 rounded-full" />
            </span>
          )}
        </span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {expanded && (
        <div className="divide-y divide-purple-50">
          {steps.map((step, i) => (
            <div key={i} className="px-3 py-2 bg-white flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">
                {step.status === 'running' ? (
                  <Loader2 size={11} className="animate-spin text-purple-500" />
                ) : (
                  <span className="text-green-500">✓</span>
                )}
              </span>
              <div className="min-w-0">
                <span className="font-medium text-gray-700">
                  {TOOL_LABELS[step.tool] ?? step.tool.replace(/_/g, ' ')}
                </span>
                {step.input && (
                  <p className="text-gray-400 truncate mt-0.5">{step.input}</p>
                )}
                {step.result && step.status === 'done' && (
                  <p className="text-gray-500 mt-0.5">{step.result}</p>
                )}
              </div>
            </div>
          ))}

          {/* Placeholder pulse row while agent is still working */}
          {streaming && (
            <div className="px-3 py-2 bg-white flex items-center gap-2 text-gray-400">
              <Loader2 size={11} className="animate-spin text-purple-400" />
              <span>Working…</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        "Hello! I'm your AI-powered financial assistant. I use an intelligent agent to analyze your transactions, compare spending patterns, and provide insights. Ask me anything like 'How much did I spend on coffee this month?' or 'Compare my spending to last month.'",
      timestamp: new Date(),
      agentMode: true,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSQL, setShowSQL] = useState<string | null>(null)
  const [showTable, setShowTable] = useState<string | null>(null)
  const [showTools, setShowTools] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const assistantId = (Date.now() + 1).toString()
    const streamingMessage: Message = {
      id: assistantId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      agentMode: true,
      streaming: true,
      thinkingSteps: [],
    }

    setMessages((prev) => [...prev, userMessage, streamingMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/query-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let step: Record<string, unknown>
          try {
            step = JSON.parse(raw)
          } catch {
            continue
          }

          if (step.type === 'tool_start') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      thinkingSteps: [
                        ...(m.thinkingSteps ?? []),
                        {
                          tool: step.tool as string,
                          input: step.input as string,
                          status: 'running' as const,
                        },
                      ],
                    }
                  : m,
              ),
            )
          } else if (step.type === 'tool_end') {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m
                const steps = [...(m.thinkingSteps ?? [])]
                // Mark last matching running step as done
                for (let i = steps.length - 1; i >= 0; i--) {
                  if (steps[i].tool === step.tool && steps[i].status === 'running') {
                    steps[i] = { ...steps[i], result: step.result as string, status: 'done' }
                    break
                  }
                }
                return { ...m, thinkingSteps: steps }
              }),
            )
          } else if (step.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: step.response as string,
                      sql: step.executedSQL as string | undefined,
                      results: step.queryResults as unknown[],
                      chartData: step.chartData as ChartData | undefined,
                      toolsUsed: step.toolsUsed as string[],
                      streaming: false,
                    }
                  : m,
              ),
            )
          } else if (step.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: `Sorry, I encountered an error: ${step.error}`,
                      streaming: false,
                    }
                  : m,
              ),
            )
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: 'Sorry, I had trouble connecting to the server. Please try again.',
                streaming: false,
              }
            : m,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    'How much did I spend this month?',
    'What are my top expense categories?',
    'Show me all coffee purchases',
    'Compare my spending to last month',
    'What was my largest transaction?',
  ]

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start gap-3 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.agentMode
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {message.type === 'user' ? (
                  <User size={18} />
                ) : message.agentMode ? (
                  <Cpu size={18} />
                ) : (
                  <Bot size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {/* Agent Mode Indicator */}
                {message.type === 'assistant' &&
                  message.agentMode &&
                  message.toolsUsed &&
                  message.toolsUsed.length > 0 &&
                  !message.streaming && (
                    <div className="mb-1 flex items-center gap-1 text-xs text-purple-600">
                      <Cpu size={10} />
                      <span>
                        Agent used {message.toolsUsed.length} tool
                        {message.toolsUsed.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                {/* Live thinking steps (shown while streaming or after) */}
                {message.type === 'assistant' && message.agentMode && (
                  <ThinkingStepsPanel
                    steps={message.thinkingSteps ?? []}
                    streaming={!!message.streaming}
                  />
                )}

                {/* Message bubble — only show once we have content */}
                {(message.content || !message.streaming) && (
                  <div
                    className={`rounded-lg p-4 mt-2 ${
                      message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.streaming && !message.content ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-purple-500" size={16} />
                        <span className="text-sm text-gray-500">Preparing answer…</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                )}

                {/* Chart Visualization */}
                {message.chartData && <MessageChart chartData={message.chartData} />}

                {/* SQL, Table, and Tools Controls */}
                {message.type === 'assistant' &&
                  !message.streaming &&
                  (message.sql ||
                    (message.results && message.results.length > 0) ||
                    (message.toolsUsed && message.toolsUsed.length > 0)) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <button
                          onClick={() =>
                            setShowTools(showTools === message.id ? null : message.id)
                          }
                          className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 px-2 py-1 bg-purple-50 rounded"
                        >
                          <Wrench size={12} />
                          {showTools === message.id ? 'Hide' : 'Show'} Tools
                        </button>
                      )}
                      {message.sql && (
                        <button
                          onClick={() => setShowSQL(showSQL === message.id ? null : message.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 bg-blue-50 rounded"
                        >
                          <Code2 size={12} />
                          {showSQL === message.id ? 'Hide' : 'Show'} SQL
                        </button>
                      )}
                      {message.results && message.results.length > 0 && (
                        <button
                          onClick={() =>
                            setShowTable(showTable === message.id ? null : message.id)
                          }
                          className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-green-50 rounded"
                        >
                          <Table size={12} />
                          {showTable === message.id ? 'Hide' : 'Show'} Data (
                          {message.results.length} rows)
                        </button>
                      )}
                    </div>
                  )}

                {/* Tools Used Display */}
                {showTools === message.id &&
                  message.toolsUsed &&
                  message.toolsUsed.length > 0 && (
                    <div className="mt-2 bg-purple-50 border border-purple-200 p-3 rounded text-sm">
                      <div className="text-purple-700 font-medium text-xs mb-1">
                        Agent Tools Used:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {message.toolsUsed.map((tool, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {tool.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* SQL Query Display */}
                {showSQL === message.id && message.sql && (
                  <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                    {message.sql}
                  </div>
                )}

                {/* Results Table */}
                {showTable === message.id && message.results && (
                  <ResultsTable results={message.results} />
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-600 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your transactions..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-black"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={20} />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
