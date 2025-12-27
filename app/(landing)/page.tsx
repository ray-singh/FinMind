'use client'

import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { TrendingUp, Sparkles, Shield, Zap, Brain, Lock, ArrowRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isSignedIn, isLoaded, router])

  const features = [
    {
      icon: <Brain className="text-blue-500" size={24} />,
      title: 'AI-Powered Agent',
      description: 'LangGraph multi-agent system with 6 specialized financial analysis tools'
    },
    {
      icon: <Sparkles className="text-purple-500" size={24} />,
      title: 'Smart Categorization',
      description: '200+ pattern rules automatically categorize transactions across 20+ categories'
    },
    {
      icon: <Zap className="text-yellow-500" size={24} />,
      title: 'Natural Language',
      description: 'Ask questions in plain English and get instant insights with visualizations'
    },
    {
      icon: <Shield className="text-green-500" size={24} />,
      title: 'Secure & Private',
      description: 'Your data stays local on your machine with enterprise-grade authentication'
    },
    {
      icon: <TrendingUp className="text-indigo-500" size={24} />,
      title: 'Real-Time Analytics',
      description: 'Interactive dashboards with monthly trends and spending insights'
    },
    {
      icon: <Lock className="text-red-500" size={24} />,
      title: 'Bank-Level Security',
      description: 'Clerk authentication with encrypted data storage'
    }
  ]

  const benefits = [
    'Upload CSV bank statements instantly',
    'Chat with your financial data',
    'Automated transaction categorization',
    'Monthly spending trends & insights',
    'Compare spending across periods',
    'Export and manage transactions'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Sparkles size={16} />
              <span>Powered by AI Agents & LangGraph</span>
            </div>
            
            <h1 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Personal Finance
              <br />
              Auto-Pilot 🚀
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your bank statements into actionable insights with AI-powered analysis.
              Upload your CSV, ask questions in natural language, and let intelligent agents
              do the heavy lifting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <SignUpButton mode="modal">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight size={20} />
                </button>
              </SignUpButton>
              
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-gray-200">
                  Sign In
                </button>
              </SignInButton>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-green-500" />
                <span>Secure Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-blue-500" />
                <span>Local Data Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                <span>AI-Powered</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  Everything you need for
                  <span className="block text-blue-600">financial clarity</span>
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <Check size={14} className="text-green-600" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-2xl opacity-20"></div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-200">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Brain size={16} className="text-purple-500" />
                        <span>AI Agent</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        "How much did I spend on coffee this month?"
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                        <Sparkles size={16} />
                        <span>Agent Response</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        You spent <strong>$42.50</strong> on coffee this month, 
                        compared to $28.50 last month. That's a 49% increase.
                      </p>
                      <div className="mt-2 flex gap-1 text-xs text-gray-500">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">compare_periods</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to take control of your finances?
            </h2>
            <p className="text-gray-600 mb-8">
              Join thousands of users who trust Finance Auto-Pilot for their financial insights.
            </p>
            <SignUpButton mode="modal">
              <button className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto">
                Start Your Journey
                <ArrowRight size={24} />
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p className="mt-2">© 2025 Personal Finance Auto-Pilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
