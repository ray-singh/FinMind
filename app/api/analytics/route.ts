import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get category breakdown for this user
    const categoryStmt = db.prepare(`
      SELECT 
        category,
        COUNT(*) as transaction_count,
        ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)) as total_spent,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned
      FROM transactions
      WHERE user_id = ?
      GROUP BY category
      ORDER BY total_spent DESC
    `)
    const categoryData = categoryStmt.all(userId)

    // Get monthly spending trend for this user
    const monthlyStmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)) as expenses,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income
      FROM transactions
      WHERE user_id = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `)
    const monthlyData = monthlyStmt.all(userId)

    // Get recent transactions for this user
    const recentStmt = db.prepare(`
      SELECT *
      FROM transactions
      WHERE user_id = ?
      ORDER BY date DESC, id DESC
      LIMIT 20
    `)
    const recentTransactions = recentStmt.all(userId)

    // Get summary statistics for this user
    const summaryStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_transactions,
        ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)) as total_expenses,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        ABS(AVG(CASE WHEN amount < 0 THEN amount ELSE 0 END)) as avg_expense,
        MIN(date) as first_transaction_date,
        MAX(date) as last_transaction_date
      FROM transactions
      WHERE user_id = ?
    `)
    const summary = summaryStmt.get(userId)

    // Get top merchants for this user
    const topMerchantsStmt = db.prepare(`
      SELECT 
        description,
        category,
        COUNT(*) as transaction_count,
        ABS(SUM(amount)) as total_amount
      FROM transactions
      WHERE amount < 0 AND user_id = ?
      GROUP BY description
      ORDER BY total_amount DESC
      LIMIT 10
    `)
    const topMerchants = topMerchantsStmt.all(userId)

    return NextResponse.json({
      categoryData,
      monthlyData: monthlyData.reverse(), // Show oldest to newest
      recentTransactions,
      summary,
      topMerchants,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: String(error) },
      { status: 500 }
    )
  }
}
