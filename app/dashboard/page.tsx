'use client'

import { useState, useEffect } from 'react'
import { Upload, MessageSquare, TrendingUp, Database, List } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import ChatInterface from '@/components/ChatInterface'
import Dashboard from '@/components/Dashboard'
import TransactionsViewer from '@/components/TransactionsViewer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Header from '@/components/Header'

// Force dynamic rendering due to authentication
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'transactions' | 'dashboard'>('dashboard')
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [transactionCount, setTransactionCount] = useState(0)

  // Check if there's existing data on mount
  useEffect(() => {
    checkExistingData()
  }, [])

  const checkExistingData = async () => {
    try {
      const response = await fetch('/api/transactions?limit=1')
      if (response.ok) {
        const data = await response.json()
        if (data.total > 0) {
          setIsDataLoaded(true)
          setTransactionCount(data.total)
        }
      }
    } catch (error) {
      console.error('Error checking existing data:', error)
    }
  }

  const handleUploadSuccess = () => {
    setIsDataLoaded(true)
    checkExistingData()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Financial Dashboard
          </h1>
          {isDataLoaded && transactionCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Database size={16} />
              <span>{transactionCount} transactions loaded</span>
            </div>
          )}
          {!isDataLoaded && (
            <p className="text-gray-600 text-sm">
              Upload your bank statements to get started with AI-powered financial insights
            </p>
          )}
        </div>

        <ErrorBoundary>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            <nav className="flex border-b bg-gradient-to-r from-gray-50 to-slate-50">
              <button
                onClick={() => setActiveTab('dashboard')}
                disabled={!isDataLoaded}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                }`}
              >
                <TrendingUp size={20} />
                Overview
                {activeTab === 'dashboard' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-t"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                disabled={!isDataLoaded}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                }`}
              >
                <MessageSquare size={20} />
                AI Chat
                {activeTab === 'chat' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-t"></div>
                )}
                {!isDataLoaded && (
                  <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    Upload first
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                disabled={!isDataLoaded}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                }`}
              >
                <List size={20} />
                Transactions
                {activeTab === 'transactions' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-t"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Upload size={20} />
                Upload Data
                {activeTab === 'upload' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-t"></div>
                )}
              </button>
            </nav>

            <div className="p-6 min-h-[600px]">
              {activeTab === 'upload' && (
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              )}
              {activeTab === 'chat' && <ChatInterface />}
              {activeTab === 'transactions' && <TransactionsViewer />}
              {activeTab === 'dashboard' && <Dashboard />}
            </div>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  )
}
