'use client'

import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { TrendingUp, Sparkles, Shield, Zap, Brain, Lock, ArrowRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Force dynamic rendering due to authentication
export const dynamic = 'force-dynamic'

export default function Home() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float animation-delay-200"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float animation-delay-400"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 opacity-0 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full text-blue-300 text-sm font-medium mb-6 border border-blue-500/30">
              <Sparkles size={16} />
              <span>Powered by AI Agents & LangGraph</span>
            </div>
            
            <h1 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              FinMind
              <br />
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your bank statements into actionable insights with AI-powered analysis.
              Upload your CSV, ask questions in natural language, and let intelligent agents
              do the heavy lifting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <SignUpButton mode="modal">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 flex items-center gap-2 animate-pulse-glow">
                  Get Started Free
                  <ArrowRight size={20} />
                </button>
              </SignUpButton>
              
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-slate-200 rounded-xl font-semibold hover:bg-white/20 hover:scale-105 transition-all duration-300 border border-white/20">
                  Sign In
                </button>
              </SignInButton>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-green-400" />
                <span>Secure Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-blue-400" />
                <span>Local Data Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <span>AI-Powered</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="opacity-0 animate-fade-in-up bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="opacity-0 animate-fade-in-up animation-delay-600 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 md:p-12 mb-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-100 mb-6">
                  Everything you need for
                  <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">financial clarity</span>
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <Check size={14} className="text-green-400" />
                      </div>
                      <span className="text-slate-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-2xl"></div>
                <div className="relative bg-slate-900/80 p-8 rounded-2xl border border-slate-700/50">
                  <div className="space-y-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <Brain size={16} className="text-purple-400" />
                        <span>AI Agent</span>
                      </div>
                      <p className="text-slate-200 font-medium">
                        "How much did I spend on coffee this month?"
                      </p>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                      <div className="flex items-center gap-2 text-sm text-blue-400 mb-2">
                        <Sparkles size={16} />
                        <span>Agent Response</span>
                      </div>
                      <p className="text-slate-300 text-sm">
                        You spent <strong className="text-blue-300">$42.50</strong> on coffee this month, 
                        compared to $28.50 last month. That's a 49% increase.
                      </p>
                      <div className="mt-2 flex gap-1 text-xs">
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">compare_periods</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Ready to take control of your finances?
            </h2>
            <p className="text-slate-400 mb-8">
              Join thousands of users who trust Finance Auto-Pilot for their financial insights.
            </p>
            <SignUpButton mode="modal">
              <button className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto animate-pulse-glow">
                Start Your Journey
                <ArrowRight size={24} />
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 backdrop-blur py-8 relative z-10">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p className="mt-2">© 2025 Personal Finance Auto-Pilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
