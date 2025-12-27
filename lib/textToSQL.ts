import { OpenAI } from 'openai'
import { db, getAllTables, getTableSchema } from './database'
import type { ChartData } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface QueryResult {
  sql: string
  results: any[]
  chartData?: ChartData
  error?: string
}

/**
 * Detect if query results should be visualized as a chart
 */
function detectChartType(userQuery: string, results: any[]): ChartData | undefined {
  if (!results || results.length === 0) return undefined

  const queryLower = userQuery.toLowerCase()
  const columns = Object.keys(results[0])

  // Check for time-series data (monthly, weekly trends)
  if (
    (queryLower.includes('month') || queryLower.includes('trend') || queryLower.includes('over time')) &&
    columns.some(c => c.includes('month') || c.includes('date') || c.includes('week'))
  ) {
    const dateKey = columns.find(c => c.includes('month') || c.includes('date') || c.includes('week')) || columns[0]
    const valueKey = columns.find(c => 
      c.includes('total') || c.includes('amount') || c.includes('sum') || c.includes('expense') || c.includes('income')
    ) || columns[1]

    if (dateKey && valueKey) {
      return {
        type: 'line',
        data: results,
        dataKey: valueKey,
        nameKey: dateKey,
        title: 'Trend Over Time'
      }
    }
  }

  // Check for category breakdown (pie chart)
  if (
    (queryLower.includes('category') || queryLower.includes('breakdown') || queryLower.includes('by type')) &&
    columns.some(c => c.includes('category') || c.includes('type'))
  ) {
    const categoryKey = columns.find(c => c.includes('category') || c.includes('type')) || columns[0]
    const valueKey = columns.find(c => 
      c.includes('total') || c.includes('amount') || c.includes('sum') || c.includes('count')
    ) || columns[1]

    if (categoryKey && valueKey && results.length <= 15) {
      return {
        type: 'pie',
        data: results,
        dataKey: valueKey,
        nameKey: categoryKey,
        title: 'Breakdown by Category'
      }
    }
  }

  // Check for comparison/ranking (bar chart)
  if (
    (queryLower.includes('top') || queryLower.includes('compare') || queryLower.includes('most') || 
     queryLower.includes('highest') || queryLower.includes('ranking')) &&
    results.length > 1 && results.length <= 20
  ) {
    const labelKey = columns.find(c => 
      c.includes('category') || c.includes('description') || c.includes('merchant') || c.includes('name')
    ) || columns[0]
    const valueKey = columns.find(c => 
      c.includes('total') || c.includes('amount') || c.includes('sum') || c.includes('count')
    ) || columns[1]

    if (labelKey && valueKey) {
      return {
        type: 'bar',
        data: results,
        dataKey: valueKey,
        nameKey: labelKey,
        title: 'Comparison'
      }
    }
  }

  return undefined
}

/**
 * Generate SQL from natural language query using OpenAI
 * Now supports multi-tenancy with userId filtering
 */
export async function textToSQL(userQuery: string, userId?: string): Promise<QueryResult> {
  try {
    // Get database schema information
    const tables = getAllTables()
    const schemaInfo = tables.map(table => {
      const columns = getTableSchema(table.name)
      return {
        table: table.name,
        columns: columns.map((col: any) => ({
          name: col.name,
          type: col.type,
        })),
      }
    })

    // Create a comprehensive schema description
    const schemaDescription = schemaInfo
      .map(
        (table) =>
          `Table: ${table.table}\nColumns: ${table.columns
            .map((col) => `${col.name} (${col.type})`)
            .join(', ')}`
      )
      .join('\n\n')

    // Create prompt for SQL generation
    const systemPrompt = `You are a SQL expert assistant. Generate SQLite queries based on user questions.

Database Schema:
${schemaDescription}

Important Notes:
- The transactions table stores financial transactions
- amount is negative for expenses and positive for income
- Use date for filtering by time periods (format: YYYY-MM-DD)
- category contains auto-categorized transaction types (Coffee, Groceries, Dining, Entertainment, Shopping, Transportation, Gas, Healthcare, Fitness, Utilities, Insurance, Subscriptions, Travel, Education, Personal Care, Pets, Home, Transfer, Cash Withdrawal, Fees, Income, Other)
- transaction_type is either 'expense' or 'income'
- Today's date is ${new Date().toISOString().split('T')[0]}

Rules:
1. Only generate SELECT queries (no INSERT, UPDATE, DELETE)
2. Use proper SQLite syntax
3. Return only the SQL query without explanations or markdown formatting
4. Use LIMIT to prevent returning too many rows (default 100)
5. For "this month", use: date >= date('now', 'start of month')
6. For "last month", use: date >= date('now', '-1 month', 'start of month') AND date < date('now', 'start of month')
7. Always use ABS(amount) when summing expenses to show positive values
8. When comparing time periods, use Common Table Expressions (CTEs) for clarity
9. Use ROUND() for monetary values with 2 decimal places
10. For category queries, use case-insensitive matching with LOWER()
11. When asked about "spending", focus on negative amounts (expenses)`

    const userPrompt = `Generate a SQL query to answer this question: "${userQuery}"`

    // Call OpenAI to generate SQL
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 500,
    })

    let sql = completion.choices[0].message.content?.trim() || ''

    // Clean up the SQL (remove markdown code blocks if present)
    sql = sql
      .replace(/```sql\n/g, '')
      .replace(/```\n/g, '')
      .replace(/```/g, '')
      .trim()

    // Inject user_id filter for multi-tenancy security
    if (userId) {
      const fromTransactionsRegex = /FROM\s+transactions\b/gi;
      const hasWhere = /FROM\s+transactions\s+WHERE/gi.test(sql);
      
      if (fromTransactionsRegex.test(sql)) {
        if (hasWhere) {
          // Add user_id condition after WHERE
          sql = sql.replace(
            /FROM\s+transactions\s+WHERE/gi,
            `FROM transactions WHERE user_id = '${userId}' AND`
          );
        } else {
          // Add WHERE clause with user_id
          sql = sql.replace(
            /FROM\s+transactions\b/gi,
            `FROM transactions WHERE user_id = '${userId}'`
          );
        }
      }
    }

    // Execute the SQL query
    const stmt = db.prepare(sql)
    const results = stmt.all()

    // Detect if results should be charted
    const chartData = detectChartType(userQuery, results)

    return {
      sql,
      results,
      chartData,
    }
  } catch (error) {
    console.error('Text-to-SQL error:', error)
    return {
      sql: '',
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Generate a natural language response from SQL results
 */
export async function generateNaturalLanguageResponse(
  userQuery: string,
  sql: string,
  results: any[]
): Promise<string> {
  try {
    const resultsPreview = JSON.stringify(results.slice(0, 10), null, 2)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a financial assistant. Given a user's question, the SQL query used, and the results, provide a clear, concise answer in natural language.
          
Guidelines:
- Be conversational and helpful
- Include specific numbers and insights from the data
- Format currency values with $ symbol
- If comparing time periods, clearly state both values
- Highlight interesting patterns or anomalies
- Keep responses concise (2-4 sentences typically)`,
        },
        {
          role: 'user',
          content: `User Question: ${userQuery}

SQL Query: ${sql}

Results (showing first 10 rows):
${resultsPreview}

Total rows returned: ${results.length}

Please provide a natural language answer to the user's question based on these results.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return completion.choices[0].message.content?.trim() || 'Unable to generate response'
  } catch (error) {
    console.error('Natural language response error:', error)
    return 'I analyzed the data but had trouble formulating a response. Please try rephrasing your question.'
  }
}
