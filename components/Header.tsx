'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  const { user, isLoaded } = useUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Finance Auto-Pilot
              </h1>
              <p className="text-xs text-gray-500">AI-Powered Financial Insights</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Transactions
            </Link>
            <Link 
              href="/" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Chat
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {isLoaded && user && (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    {user.firstName || user.username || 'User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-blue-500 ring-offset-2"
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
