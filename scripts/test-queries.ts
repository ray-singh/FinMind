import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { executeRawQuery, getFinancialSummary } from '../lib/db/queries'
import { getSql } from '../lib/db/index'

async function testQueries() {
  console.log('Testing agent query functions...\n')
  
  // First, get actual user IDs from the database
  const sql = getSql()
  const users = await sql`SELECT DISTINCT user_id FROM transactions LIMIT 1`
  const testUserId = users[0]?.user_id || 'test-user-123'
  console.log('Using user_id:', testUserId, '\n')
  
  // Test 1: getFinancialSummary
  try {
    console.log('1. getFinancialSummary...')
    const summary = await getFinancialSummary(testUserId)
    console.log('   ✓ Success:', summary)
  } catch (e: any) {
    console.error('   ✗ Failed:', e.message)
  }
  
  // Test 2: executeRawQuery - simple count
  try {
    console.log('2. executeRawQuery (SELECT COUNT)...')
    const result = await executeRawQuery(testUserId, 'SELECT COUNT(*) as count FROM transactions')
    console.log('   ✓ Success:', result)
  } catch (e: any) {
    console.error('   ✗ Failed:', e.message)
  }
  
  // Test 3: executeRawQuery with GROUP BY
  try {
    console.log('3. executeRawQuery (GROUP BY category)...')
    const result = await executeRawQuery(testUserId, `
      SELECT category, COUNT(*) as count, ABS(SUM(amount))::numeric(10,2) as total
      FROM transactions 
      GROUP BY category
      ORDER BY total DESC
    `)
    console.log('   ✓ Success:', result.length, 'categories')
    result.forEach(r => console.log('     -', r.category, ':', r.count, 'txns, $' + r.total))
  } catch (e: any) {
    console.error('   ✗ Failed:', e.message)
  }
  
  // Test 4: executeRawQuery with WHERE
  try {
    console.log('4. executeRawQuery (WHERE clause)...')
    const result = await executeRawQuery(testUserId, `
      SELECT description, amount, category 
      FROM transactions 
      WHERE amount < 0
      ORDER BY amount ASC
      LIMIT 5
    `)
    console.log('   ✓ Success:', result.length, 'transactions')
    result.forEach(r => console.log('     -', r.description, ':', '$' + r.amount))
  } catch (e: any) {
    console.error('   ✗ Failed:', e.message)
  }
  
  console.log('\nDone!')
}

testQueries()
