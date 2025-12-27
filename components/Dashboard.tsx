'use client'

import { useEffect, useState } from 'react'
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
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Loader2, TrendingDown, TrendingUp, DollarSign, Activity } from 'lucide-react'

interface AnalyticsData {
  categoryData: any[]
  monthlyData: any[]
  recentTransactions: any[]
  summary: any
  topMerchants: any[]
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      } else {
        setError('Failed to load analytics')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>{error || 'No data available'}</p>
      </div>
    )
  }

  const netSavings = (data.summary.total_income || 0) - (data.summary.total_expenses || 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Transactions</p>
              <p className="text-3xl font-bold">{data.summary.total_transactions}</p>
            </div>
            <Activity className="text-blue-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Total Expenses</p>
              <p className="text-3xl font-bold">
                ${data.summary.total_expenses?.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingDown className="text-red-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Income</p>
              <p className="text-3xl font-bold">
                ${data.summary.total_income?.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="text-green-200" size={40} />
          </div>
        </div>

        <div className={`bg-gradient-to-br ${netSavings >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'} text-white rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${netSavings >= 0 ? 'text-emerald-100' : 'text-orange-100'} text-sm mb-1`}>Net Savings</p>
              <p className="text-3xl font-bold">
                ${Math.abs(netSavings).toFixed(2)}
              </p>
            </div>
            <DollarSign className={netSavings >= 0 ? 'text-emerald-200' : 'text-orange-200'} size={40} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.categoryData.filter((c: any) => c.total_spent > 0)}
                dataKey="total_spent"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.category}: $${entry.total_spent.toFixed(2)}`}
              >
                {data.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories by Spending */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
              <Bar dataKey="total_spent" fill="#3b82f6" name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx: any, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-gray-600">{tx.date}</td>
                    <td className="p-2 truncate max-w-[150px]" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`p-2 text-right font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.abs(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Merchants */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Merchants by Spending</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.topMerchants.map((merchant: any, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {merchant.category}
                </span>
              </div>
              <p className="font-medium text-sm mb-1 truncate" title={merchant.description}>
                {merchant.description}
              </p>
              <p className="text-lg font-bold text-red-600">
                ${merchant.total_amount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {merchant.transaction_count} transaction{merchant.transaction_count !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
