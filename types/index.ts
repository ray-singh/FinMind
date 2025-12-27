// Common types used across the application

export interface Transaction {
  id?: number
  date: string
  description: string
  amount: number
  category?: string
  account?: string
  transaction_type?: 'expense' | 'income'
  created_at?: string
}

export interface CategoryRule {
  id: number
  pattern: string
  category: string
  created_at?: string
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  sql?: string
  results?: any[]
  chartData?: ChartData
  timestamp: Date
  // Agent-specific fields
  agentMode?: boolean
  toolsUsed?: string[]
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line'
  data: any[]
  dataKey?: string
  nameKey?: string
  title?: string
}

export interface QueryResponse {
  query: string
  sql: string
  results: any[]
  response: string
  resultCount: number
  chartData?: ChartData
  // Agent-specific fields
  agentMode?: boolean
  toolsUsed?: string[]
}

export interface AnalyticsData {
  categoryData: CategorySummary[]
  monthlyData: MonthlyData[]
  recentTransactions: Transaction[]
  summary: FinancialSummary
  topMerchants: MerchantSummary[]
}

export interface CategorySummary {
  category: string
  transaction_count: number
  total_spent: number
  total_earned: number
}

export interface MonthlyData {
  month: string
  expenses: number
  income: number
}

export interface FinancialSummary {
  total_transactions: number
  total_expenses: number
  total_income: number
  avg_expense: number
  first_transaction_date: string
  last_transaction_date: string
}

export interface MerchantSummary {
  description: string
  category: string
  transaction_count: number
  total_amount: number
}

export interface UploadResponse {
  success: boolean
  message: string
  processedCount: number
  errors?: string[]
}

export interface APIError {
  error: string
  details?: string
  message?: string
}
