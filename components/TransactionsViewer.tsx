'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Filter, X, Edit2, Trash2, Save } from 'lucide-react'
import type { Transaction } from '@/types'

interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  limit: number
  offset: number
  categories: string[]
}

export default function TransactionsViewer() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCategory, setEditCategory] = useState('')
  const limit = 20

  useEffect(() => {
    fetchTransactions()
  }, [page, search, categoryFilter])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
      })

      const response = await fetch(`/api/transactions?${params}`)
      if (response.ok) {
        const data: TransactionsResponse = await response.json()
        setTransactions(data.transactions)
        setTotal(data.total)
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleSaveCategory = async (id: number) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category: editCategory }),
      })
      if (response.ok) {
        setEditingId(null)
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {(search || categoryFilter) && (
          <button
            onClick={() => {
              setSearch('')
              setCategoryFilter('')
              setPage(1)
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <X size={16} />
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} of {total} transactions
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{tx.date}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === tx.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveCategory(tx.id!)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {tx.category}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(tx.id!)
                            setEditCategory(tx.category || '')
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit category"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id!)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page - 2 + i
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg ${
                    page === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
