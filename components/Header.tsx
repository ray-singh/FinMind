'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  const { user, isLoaded } = useUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                FinMind
              </h1>
              <p className="text-xs text-slate-400">AI-Powered Financial Insights</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/" 
              className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors"
            >
              Transactions
            </Link>
            <Link 
              href="/" 
              className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors"
            >
              Chat
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {isLoaded && user && (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-200">
                    {user.firstName || user.username || 'User'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
