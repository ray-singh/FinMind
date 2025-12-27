import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stmt = db.prepare('SELECT * FROM category_rules ORDER BY category, pattern')
    const rules = stmt.all()

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { pattern, category } = await request.json()

    if (!pattern || !category) {
      return NextResponse.json(
        { error: 'Pattern and category are required' },
        { status: 400 }
      )
    }

    const stmt = db.prepare(`
      INSERT INTO category_rules (pattern, category) VALUES (?, ?)
    `)
    const result = stmt.run(pattern.toUpperCase(), category)

    // Re-categorize existing transactions with this pattern (only for this user)
    const updateStmt = db.prepare(`
      UPDATE transactions 
      SET category = ? 
      WHERE UPPER(description) LIKE ? AND user_id = ?
    `)
    const updateResult = updateStmt.run(category, `%${pattern.toUpperCase()}%`, userId)

    return NextResponse.json({
      success: true,
      ruleId: result.lastInsertRowid,
      transactionsUpdated: updateResult.changes,
    })
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'This pattern already exists' },
        { status: 400 }
      )
    }
    console.error('Add category error:', error)
    return NextResponse.json(
      { error: 'Failed to add category rule', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    const stmt = db.prepare('DELETE FROM category_rules WHERE id = ?')
    const result = stmt.run(parseInt(id))

    return NextResponse.json({
      success: true,
      deleted: result.changes > 0,
    })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category rule', details: String(error) },
      { status: 500 }
    )
  }
}
