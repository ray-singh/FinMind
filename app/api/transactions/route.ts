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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    // Build query dynamically - always filter by user_id
    let whereConditions: string[] = ['user_id = ?']
    let params: any[] = [userId]

    if (category) {
      whereConditions.push('category = ?')
      params.push(category)
    }

    if (startDate) {
      whereConditions.push('date >= ?')
      params.push(startDate)
    }

    if (endDate) {
      whereConditions.push('date <= ?')
      params.push(endDate)
    }

    if (search) {
      whereConditions.push('description LIKE ?')
      params.push(`%${search}%`)
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['date', 'amount', 'description', 'category', 'id']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'date'
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM transactions ${whereClause}`)
    const countResult = countStmt.get(...params) as { total: number }

    // Get transactions
    const query = `
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `
    const stmt = db.prepare(query)
    const transactions = stmt.all(...params, limit, offset)

    // Get available categories for filtering (user-specific)
    const categoriesStmt = db.prepare('SELECT DISTINCT category FROM transactions WHERE user_id = ? ORDER BY category')
    const categories = categoriesStmt.all(userId) as Array<{ category: string }>

    return NextResponse.json({
      transactions,
      total: countResult.total,
      limit,
      offset,
      categories: categories.map(c => c.category),
    })
  } catch (error) {
    console.error('Transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: String(error) },
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

    if (id) {
      // Delete single transaction (only if it belongs to this user)
      const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
      const result = stmt.run(parseInt(id), userId)
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${result.changes} transaction(s)` 
      })
    }

    // Delete all transactions for this user
    const deleteAll = searchParams.get('deleteAll') === 'true'
    if (deleteAll) {
      const stmt = db.prepare('DELETE FROM transactions WHERE user_id = ?')
      const result = stmt.run(userId)
      return NextResponse.json({ 
        success: true, 
        message: `All ${result.changes} transactions deleted` 
      })
    }

    return NextResponse.json(
      { error: 'No id or deleteAll parameter provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, category, description } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const updates: string[] = []
    const params: any[] = []

    if (category !== undefined) {
      updates.push('category = ?')
      params.push(category)
    }

    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    // Only update if transaction belongs to this user
    params.push(id, userId)
    const stmt = db.prepare(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
    const result = stmt.run(...params)

    return NextResponse.json({
      success: true,
      message: `Updated ${result.changes} transaction(s)`,
    })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction', details: String(error) },
      { status: 500 }
    )
  }
}
