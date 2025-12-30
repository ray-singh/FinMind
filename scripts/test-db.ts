import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getSql } from '../lib/db/index'

async function testConnection() {
  console.log('Testing DB connection...')
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL)
  
  try {
    const sql = getSql()
    const result = await sql`SELECT COUNT(*) as count FROM transactions`
    console.log('✓ DB Connection: SUCCESS')
    console.log('  Transaction count:', result[0].count)
    
    const rules = await sql`SELECT COUNT(*) as count FROM category_rules`
    console.log('  Category rules:', rules[0].count)
    
    return true
  } catch (e: any) {
    console.error('✗ DB Connection: FAILED')
    console.error('  Error:', e.message)
    return false
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1)
})
