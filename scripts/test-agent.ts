import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { runFinanceAgent } from '../lib/agent'
import { getSql } from '../lib/db/index'

async function testAgent() {
  console.log('Testing Finance Agent...\n')
  console.log('DATABASE_URL:', !!process.env.DATABASE_URL)
  console.log('OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY)
  
  // Get a real user ID
  const sql = getSql()
  const users = await sql`SELECT DISTINCT user_id FROM transactions LIMIT 1`
  const testUserId = users[0]?.user_id
  
  if (!testUserId) {
    console.error('No transactions found in database')
    return
  }
  
  console.log('Using user_id:', testUserId, '\n')
  
  // Test 1: Simple query
  try {
    console.log('Test 1: "How much did I spend?"')
    const result = await runFinanceAgent('How much did I spend?', testUserId)
    console.log('✓ Response:', result.response)
    console.log('  Tools used:', result.toolsUsed)
    console.log('  SQL executed:', result.executedSQL || 'none')
    console.log()
  } catch (e: any) {
    console.error('✗ Error:', e.message)
    console.error('  Stack:', e.stack)
    console.log()
  }
  
  // Test 2: Category breakdown
  try {
    console.log('Test 2: "Show me spending by category"')
    const result = await runFinanceAgent('Show me spending by category', testUserId)
    console.log('✓ Response:', result.response.substring(0, 200) + '...')
    console.log('  Tools used:', result.toolsUsed)
    console.log()
  } catch (e: any) {
    console.error('✗ Error:', e.message)
    console.error('  Stack:', e.stack)
    console.log()
  }
  
  console.log('Done!')
}

testAgent().catch(console.error)
