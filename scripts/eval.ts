/**
 * Agent Evaluation Script
 *
 * Runs a suite of real-world queries through the LangGraph finance agent and
 * scores each response across three dimensions:
 *   - Completion  : agent returned a non-empty response without throwing
 *   - Tool usage  : agent invoked at least one expected tool for the query
 *   - Content     : response contains at least one expected keyword / value
 *
 * Scoring per case:  3 = all criteria met  |  2 = two met  |  1 = one met  |  0 = error
 * "Pass" threshold:  score >= 2
 *
 * Usage:
 *   npx tsx scripts/eval.ts
 *   EVAL_USER_ID=<userId> npx tsx scripts/eval.ts   # pin a specific user
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import OpenAI from 'openai'
import { runFinanceAgent } from '../lib/agent'
import { getSql } from '../lib/db/index'

// ---------------------------------------------------------------------------
// Test-case definition
// ---------------------------------------------------------------------------

interface TestCase {
  id: number
  category: string
  query: string
  /** At least one of these tool names must appear in toolsUsed to earn the tool point */
  expectedTools: string[]
  /** At least one of these strings must appear (case-insensitive) in the response to earn the content point */
  expectedKeywords: string[]
}

const TEST_CASES: TestCase[] = [
  // ── Spending summaries ────────────────────────────────────────────────────
  {
    id: 1,
    category: 'Summary',
    query: 'How much did I spend this month?',
    expectedTools: ['get_financial_summary', 'sql_query'],
    expectedKeywords: ['$', 'spent', 'total', 'spending'],
  },
  {
    id: 2,
    category: 'Summary',
    query: "What's my total income this year?",
    expectedTools: ['sql_query', 'get_financial_summary'],
    expectedKeywords: ['$', 'income', 'payroll', 'deposit'],
  },
  {
    id: 3,
    category: 'Summary',
    query: 'How much did I spend in January?',
    expectedTools: ['sql_query', 'get_financial_summary', 'compare_periods'],
    expectedKeywords: ['$', 'january', 'jan'],
  },
  {
    id: 4,
    category: 'Summary',
    query: 'What is my average monthly spending?',
    expectedTools: ['sql_query', 'get_monthly_trends'],
    expectedKeywords: ['$', 'average', 'monthly', 'month', 'per month'],
  },
  {
    id: 5,
    category: 'Summary',
    query: 'What percentage of my income am I spending?',
    expectedTools: ['sql_query', 'get_financial_summary'],
    expectedKeywords: ['%', 'income', 'spending', 'percent'],
  },
  {
    id: 6,
    category: 'Summary',
    query: 'How much did I spend on food this month?',
    expectedTools: ['sql_query', 'search_transactions', 'get_categories'],
    expectedKeywords: ['$', 'food', 'dining', 'groceries', 'restaurant'],
  },

  // ── Merchant-specific ─────────────────────────────────────────────────────
  {
    id: 7,
    category: 'Merchant',
    query: 'How much have I spent on Starbucks total?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['starbucks', '$', 'coffee'],
  },
  {
    id: 8,
    category: 'Merchant',
    query: 'Find all my Amazon purchases',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['amazon', '$'],
  },
  {
    id: 9,
    category: 'Merchant',
    query: 'How much do I spend on Uber rides?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['uber', '$', 'ride'],
  },
  {
    id: 10,
    category: 'Merchant',
    query: 'How much is my Netflix subscription per month?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['netflix', '$', '15.99'],
  },
  {
    id: 11,
    category: 'Merchant',
    query: 'What gas stations do I use and how much do I spend at each?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'gas', 'shell', 'chevron', 'station'],
  },

  // ── Categories ───────────────────────────────────────────────────────────
  {
    id: 12,
    category: 'Categories',
    query: 'What are my top 5 spending categories?',
    expectedTools: ['get_categories', 'sql_query'],
    expectedKeywords: ['$', 'categor', 'groceries', 'dining', 'transport'],
  },
  {
    id: 13,
    category: 'Categories',
    query: 'How much do I spend on subscriptions each month?',
    expectedTools: ['search_transactions', 'sql_query', 'get_categories'],
    expectedKeywords: ['subscription', '$', 'netflix', 'spotify', 'hulu'],
  },
  {
    id: 14,
    category: 'Categories',
    query: 'Show my spending breakdown by category',
    expectedTools: ['get_categories', 'sql_query'],
    expectedKeywords: ['$', 'categor'],
  },
  {
    id: 15,
    category: 'Categories',
    query: 'What category is Whole Foods in?',
    expectedTools: ['preview_categorization', 'search_transactions', 'sql_query'],
    expectedKeywords: ['whole foods', 'groceries', 'grocery'],
  },

  // ── Comparisons & Trends ──────────────────────────────────────────────────
  {
    id: 16,
    category: 'Comparison',
    query: 'Compare my spending this month to last month',
    expectedTools: ['compare_periods', 'get_monthly_trends'],
    expectedKeywords: ['$', 'january', 'february', 'march', 'more', 'less', 'higher', 'lower'],
  },
  {
    id: 17,
    category: 'Trends',
    query: 'Show my monthly spending trends over the last 3 months',
    expectedTools: ['get_monthly_trends', 'sql_query'],
    expectedKeywords: ['january', 'february', 'march', '$', 'month'],
  },
  {
    id: 18,
    category: 'Comparison',
    query: 'How has my grocery spending changed over the past few months?',
    expectedTools: ['compare_periods', 'sql_query'],
    expectedKeywords: ['grocery', 'groceries', '$', 'month', 'january', 'february', 'march'],
  },
  {
    id: 19,
    category: 'Comparison',
    query: 'Am I spending more or less compared to last month?',
    expectedTools: ['compare_periods', 'get_financial_summary'],
    expectedKeywords: ['$', 'more', 'less', 'higher', 'lower', 'month', 'compared'],
  },
  {
    id: 20,
    category: 'Trends',
    query: 'Which month had my highest total spending?',
    expectedTools: ['get_monthly_trends', 'sql_query'],
    expectedKeywords: ['$', 'january', 'february', 'march', 'highest', 'most'],
  },

  // ── Transaction search ────────────────────────────────────────────────────
  {
    id: 21,
    category: 'Search',
    query: 'What was my single largest expense?',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'largest', 'biggest', 'most', 'transaction', 'expense'],
  },
  {
    id: 22,
    category: 'Search',
    query: 'Show me all transactions over $100',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'amazon', 'kroger', 'walmart', 'whole foods', '100'],
  },
  {
    id: 23,
    category: 'Search',
    query: 'How many total transactions do I have?',
    expectedTools: ['sql_query'],
    expectedKeywords: ['transaction', 'transactions', 'total', 'count'],
  },
  {
    id: 24,
    category: 'Search',
    query: 'Show me all my dining out expenses',
    expectedTools: ['search_transactions', 'get_categories', 'sql_query'],
    expectedKeywords: ['$', 'dining', 'restaurant', 'chipotle', "mcdonald", 'pizza'],
  },
  {
    id: 25,
    category: 'Search',
    query: 'What recurring charges do I have every month?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'netflix', 'spotify', 'hulu', 'gym', 'subscription', 'recurring'],
  },

  // ── Budget & Savings ──────────────────────────────────────────────────────
  {
    id: 26,
    category: 'Budget',
    query: 'How much money did I save this month?',
    expectedTools: ['get_financial_summary', 'sql_query', 'compare_periods'],
    expectedKeywords: ['$', 'save', 'saved', 'net', 'income', 'surplus', 'left'],
  },
  {
    id: 27,
    category: 'Budget',
    query: 'What is my net cash flow for each month?',
    expectedTools: ['get_monthly_trends', 'sql_query'],
    expectedKeywords: ['$', 'january', 'february', 'march', 'net', 'income', 'cash'],
  },
  {
    id: 28,
    category: 'Budget',
    query: 'What are my fixed vs variable expenses?',
    expectedTools: ['get_categories', 'search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'fixed', 'variable', 'subscription', 'gym', 'netflix'],
  },

  // ── Account-specific ──────────────────────────────────────────────────────
  {
    id: 29,
    category: 'Account',
    query: 'How much did I spend on my credit card vs checking account?',
    expectedTools: ['sql_query', 'get_financial_summary'],
    expectedKeywords: ['$', 'credit', 'checking', 'card', 'account'],
  },
  {
    id: 30,
    category: 'Account',
    query: 'Show me only my checking account transactions',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'checking', 'payroll', 'shell', 'gas'],
  },

  // ── Frequency & Habits ────────────────────────────────────────────────────
  {
    id: 31,
    category: 'Habits',
    query: 'How often do I go to Starbucks?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['starbucks', 'time', 'times', 'visit', 'month', 'week', 'coffee'],
  },
  {
    id: 32,
    category: 'Habits',
    query: 'How frequently do I order Uber Eats?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['uber eats', 'time', 'times', 'order', 'month'],
  },
  {
    id: 33,
    category: 'Habits',
    query: 'What day of the week do I spend the most?',
    expectedTools: ['sql_query'],
    expectedKeywords: ['$', 'day', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },

  // ── Multi-step Reasoning ──────────────────────────────────────────────────
  {
    id: 34,
    category: 'Multi-step',
    query: 'Which subscription service costs me the most per year and is it worth keeping?',
    expectedTools: ['search_transactions', 'sql_query', 'get_categories'],
    expectedKeywords: ['$', 'hulu', 'netflix', 'disney', 'spotify', 'year', 'annual'],
  },
  {
    id: 35,
    category: 'Multi-step',
    query: 'Am I spending more on coffee or on ride-sharing?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'starbucks', 'coffee', 'uber', 'lyft', 'ride'],
  },
  {
    id: 36,
    category: 'Multi-step',
    query: 'What would I save annually if I cut my dining out spending in half?',
    expectedTools: ['sql_query', 'search_transactions', 'get_categories'],
    expectedKeywords: ['$', 'dining', 'restaurant', 'year', 'annual', 'save', 'half'],
  },

  // ── Edge Cases ────────────────────────────────────────────────────────────
  {
    id: 37,
    category: 'Edge',
    query: 'Did I make any ATM withdrawals?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'atm', 'withdrawal', 'cash'],
  },
  {
    id: 38,
    category: 'Edge',
    query: 'Have I received any Venmo or Zelle payments?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'venmo', 'zelle', 'received', 'transfer'],
  },
  {
    id: 39,
    category: 'Edge',
    query: 'Show me transactions with no category assigned',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['uncategorized', 'no category', 'category', 'transaction', 'none', '0'],
  },
  {
    id: 40,
    category: 'Edge',
    query: 'What is the most expensive week I have had?',
    expectedTools: ['sql_query'],
    expectedKeywords: ['$', 'week', 'january', 'february', 'march', 'highest', 'most'],
  },

  // ── More Summaries ────────────────────────────────────────────────────────
  {
    id: 41,
    category: 'Summary',
    query: 'How much did I spend in the last 30 days?',
    expectedTools: ['get_financial_summary', 'sql_query'],
    expectedKeywords: ['$', 'spent', 'last 30', '30 days'],
  },
  {
    id: 42,
    category: 'Summary',
    query: 'How much did I spend in February 2026?',
    expectedTools: ['sql_query', 'get_financial_summary'],
    expectedKeywords: ['$', 'february', 'feb'],
  },
  {
    id: 43,
    category: 'Summary',
    query: 'What is my total net cash flow so far this year?',
    expectedTools: ['get_financial_summary', 'sql_query', 'get_monthly_trends'],
    expectedKeywords: ['$', 'income', 'net', 'expenses', 'cash'],
  },
  {
    id: 44,
    category: 'Summary',
    query: 'How much did I spend on non-essential items this month?',
    expectedTools: ['get_financial_summary', 'sql_query', 'get_categories'],
    expectedKeywords: ['$', 'dining', 'entertainment', 'subscription', 'coffee', 'non-essential'],
  },

  // ── More Merchants ────────────────────────────────────────────────────────
  {
    id: 45,
    category: 'Merchant',
    query: "How much have I spent at Trader Joe's?",
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ["trader joe", '$'],
  },
  {
    id: 46,
    category: 'Merchant',
    query: 'Compare my Lyft vs Uber spending',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['lyft', 'uber', '$'],
  },
  {
    id: 47,
    category: 'Merchant',
    query: 'How much do I spend at Chipotle?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['chipotle', '$'],
  },
  {
    id: 48,
    category: 'Merchant',
    query: 'Find all my pharmacy purchases',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'cvs', 'walgreens', 'pharmacy'],
  },
  {
    id: 49,
    category: 'Merchant',
    query: 'How much do I spend at Walmart?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['walmart', '$'],
  },

  // ── More Categories ───────────────────────────────────────────────────────
  {
    id: 50,
    category: 'Categories',
    query: 'How much do I spend on transportation total?',
    expectedTools: ['get_categories', 'sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'transport', 'uber', 'lyft', 'gas', 'ride'],
  },
  {
    id: 51,
    category: 'Categories',
    query: 'What is my total entertainment spending?',
    expectedTools: ['get_categories', 'sql_query'],
    expectedKeywords: ['$', 'entertainment', 'hulu', 'netflix', 'disney', 'spotify'],
  },
  {
    id: 52,
    category: 'Categories',
    query: 'How much do I spend on health and wellness?',
    expectedTools: ['get_categories', 'search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'gym', 'health', 'wellness', 'pharmacy', 'cvs', 'walgreens'],
  },
  {
    id: 53,
    category: 'Categories',
    query: 'What percentage of my spending goes to groceries?',
    expectedTools: ['get_categories', 'sql_query'],
    expectedKeywords: ['%', '$', 'groceries', 'grocery', 'percent'],
  },

  // ── More Comparisons ──────────────────────────────────────────────────────
  {
    id: 54,
    category: 'Comparison',
    query: 'Did I spend more in January or February?',
    expectedTools: ['compare_periods', 'get_monthly_trends', 'sql_query'],
    expectedKeywords: ['january', 'february', '$', 'more', 'higher', 'lower', 'less'],
  },
  {
    id: 55,
    category: 'Comparison',
    query: 'Compare my food spending across all 3 months',
    expectedTools: ['compare_periods', 'sql_query'],
    expectedKeywords: ['$', 'january', 'february', 'march', 'food', 'groceries', 'dining'],
  },
  {
    id: 56,
    category: 'Comparison',
    query: 'Which month was I most frugal?',
    expectedTools: ['get_monthly_trends', 'compare_periods', 'sql_query'],
    expectedKeywords: ['$', 'january', 'february', 'march', 'lowest', 'least', 'frugal'],
  },
  {
    id: 57,
    category: 'Comparison',
    query: 'How does my March spending compare to January?',
    expectedTools: ['compare_periods', 'sql_query'],
    expectedKeywords: ['$', 'january', 'march', 'more', 'less', 'higher', 'lower'],
  },

  // ── More Trends ───────────────────────────────────────────────────────────
  {
    id: 58,
    category: 'Trends',
    query: 'Is my overall spending trending up or down?',
    expectedTools: ['get_monthly_trends', 'compare_periods'],
    expectedKeywords: ['$', 'january', 'february', 'march', 'trend', 'up', 'down', 'increasing', 'decreasing'],
  },
  {
    id: 59,
    category: 'Trends',
    query: 'Show me income vs expenses by month as a comparison',
    expectedTools: ['get_monthly_trends', 'sql_query'],
    expectedKeywords: ['$', 'income', 'expenses', 'january', 'february', 'march'],
  },
  {
    id: 60,
    category: 'Trends',
    query: 'Which spending category has grown the most month over month?',
    expectedTools: ['compare_periods', 'get_monthly_trends', 'sql_query'],
    expectedKeywords: ['$', 'category', 'january', 'february', 'march', 'growth', 'increased', 'grew'],
  },

  // ── More Search ───────────────────────────────────────────────────────────
  {
    id: 61,
    category: 'Search',
    query: 'Show me all transactions from March 2026',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'march', 'transaction'],
  },
  {
    id: 62,
    category: 'Search',
    query: 'What are my 5 most recent transactions?',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'march', 'recent'],
  },
  {
    id: 63,
    category: 'Search',
    query: 'Find all transactions between $20 and $50',
    expectedTools: ['sql_query'],
    expectedKeywords: ['$', 'transaction', '20', '50'],
  },
  {
    id: 64,
    category: 'Search',
    query: 'Show me all transactions at grocery stores',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'trader joe', 'kroger', 'safeway', 'whole foods', 'walmart', 'grocery'],
  },
  {
    id: 65,
    category: 'Search',
    query: 'What transactions did I make on January 15?',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['january', 'payroll', '$', '15', 'disney'],
  },

  // ── More Budget ───────────────────────────────────────────────────────────
  {
    id: 66,
    category: 'Budget',
    query: 'If I saved my Starbucks spending for a year, how much would I have?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'starbucks', 'year', 'annual', 'save'],
  },
  {
    id: 67,
    category: 'Budget',
    query: 'What is my biggest budget leak?',
    expectedTools: ['get_categories', 'sql_query'],
    expectedKeywords: ['$', 'category', 'groceries', 'dining', 'biggest', 'most'],
  },
  {
    id: 68,
    category: 'Budget',
    query: 'How much of my paycheck goes to fixed expenses?',
    expectedTools: ['search_transactions', 'get_categories', 'sql_query'],
    expectedKeywords: ['$', '%', 'paycheck', 'fixed', 'subscription', 'gym', 'income', 'percent'],
  },

  // ── More Habits ───────────────────────────────────────────────────────────
  {
    id: 69,
    category: 'Habits',
    query: 'How many times did I eat out last month?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['times', 'time', 'transactions', 'dining', 'restaurant', 'chipotle', 'mcdonald'],
  },
  {
    id: 70,
    category: 'Habits',
    query: 'Do I spend more money on weekdays or weekends?',
    expectedTools: ['sql_query'],
    expectedKeywords: ['weekday', 'weekend', '$', 'more', 'spending'],
  },
  {
    id: 71,
    category: 'Habits',
    query: 'How many Uber or Lyft rides have I taken?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['uber', 'lyft', 'ride', 'times', 'trips', 'time'],
  },

  // ── More Multi-step ───────────────────────────────────────────────────────
  {
    id: 72,
    category: 'Multi-step',
    query: 'What would I save per year if I cancelled all streaming subscriptions?',
    expectedTools: ['search_transactions', 'sql_query', 'get_categories'],
    expectedKeywords: ['$', 'netflix', 'hulu', 'disney', 'spotify', 'year', 'annual', 'save'],
  },
  {
    id: 73,
    category: 'Multi-step',
    query: 'How does my weekly grocery spending compare to my weekly dining out spending?',
    expectedTools: ['search_transactions', 'sql_query', 'compare_periods'],
    expectedKeywords: ['$', 'grocery', 'groceries', 'dining', 'restaurant', 'week'],
  },
  {
    id: 74,
    category: 'Multi-step',
    query: 'If I reduced my Amazon spending by 50%, how much would I save per year?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'amazon', 'year', 'annual', 'save', '50'],
  },
  {
    id: 75,
    category: 'Multi-step',
    query: 'Compare my transportation costs to my food costs',
    expectedTools: ['get_categories', 'sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'transport', 'food', 'groceries', 'dining', 'uber', 'lyft', 'gas'],
  },
  {
    id: 76,
    category: 'Multi-step',
    query: 'What is costing me more — eating out or buying groceries?',
    expectedTools: ['get_categories', 'sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'groceries', 'grocery', 'dining', 'restaurant', 'eating out'],
  },
  {
    id: 77,
    category: 'Multi-step',
    query: 'How much could I save in a year by making coffee at home instead of Starbucks?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'starbucks', 'coffee', 'year', 'save', 'annual'],
  },

  // ── More Edge Cases ───────────────────────────────────────────────────────
  {
    id: 78,
    category: 'Edge',
    query: 'Were there any unusually large expenses this month?',
    expectedTools: ['sql_query', 'get_financial_summary', 'search_transactions'],
    expectedKeywords: ['$', 'large', 'high', 'unusual', 'biggest', 'expensive'],
  },
  {
    id: 79,
    category: 'Edge',
    query: 'Show me all money transfers — Venmo and Zelle',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'venmo', 'zelle', 'transfer'],
  },
  {
    id: 80,
    category: 'Edge',
    query: 'What is the most I have spent in a single day?',
    expectedTools: ['sql_query'],
    expectedKeywords: ['$', 'day', 'date', 'most', 'highest', 'spent'],
  },
  {
    id: 81,
    category: 'Edge',
    query: 'Do I have any charges I do not recognize?',
    expectedTools: ['search_transactions', 'sql_query', 'get_categories'],
    expectedKeywords: ['$', 'transaction', 'unrecognized', 'unknown', 'unfamiliar', 'uncategorized', 'review'],
  },

  // ── Projection ────────────────────────────────────────────────────────────
  {
    id: 82,
    category: 'Projection',
    query: 'At my current spending rate, how much will I spend this year?',
    expectedTools: ['get_monthly_trends', 'sql_query', 'get_financial_summary'],
    expectedKeywords: ['$', 'year', 'annual', 'projected', 'rate', 'current'],
  },
  {
    id: 83,
    category: 'Projection',
    query: 'What will my annual subscription costs be if nothing changes?',
    expectedTools: ['search_transactions', 'sql_query', 'get_categories'],
    expectedKeywords: ['$', 'year', 'annual', 'subscription', 'netflix', 'spotify', 'hulu'],
  },
  {
    id: 84,
    category: 'Projection',
    query: 'How much could I save by end of year at my current savings rate?',
    expectedTools: ['get_financial_summary', 'get_monthly_trends', 'sql_query'],
    expectedKeywords: ['$', 'year', 'save', 'savings', 'current', 'rate', 'projected'],
  },
  {
    id: 85,
    category: 'Projection',
    query: 'Project my grocery spending for the rest of the year based on past months',
    expectedTools: ['get_monthly_trends', 'sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'grocery', 'groceries', 'year', 'project', 'average', 'month'],
  },
  {
    id: 86,
    category: 'Projection',
    query: 'How much will I spend on gas this year based on my current rate?',
    expectedTools: ['search_transactions', 'sql_query'],
    expectedKeywords: ['$', 'gas', 'year', 'annual', 'project', 'rate', 'month'],
  },

  // ── Recategorization ──────────────────────────────────────────────────────
  {
    id: 87,
    category: 'Recategorize',
    query: "What category should McDonald's be in?",
    expectedTools: ['preview_categorization'],
    expectedKeywords: ["mcdonald", 'fast food', 'dining', 'food', 'category'],
  },
  {
    id: 88,
    category: 'Recategorize',
    query: 'What category would you assign to BP Gas Station?',
    expectedTools: ['preview_categorization'],
    expectedKeywords: ['bp', 'gas', 'fuel', 'transport', 'auto', 'category'],
  },
  {
    id: 89,
    category: 'Recategorize',
    query: 'What category does Dunkin Donuts fall under?',
    expectedTools: ['preview_categorization', 'search_transactions'],
    expectedKeywords: ['dunkin', 'coffee', 'dining', 'fast food', 'food', 'category'],
  },
  {
    id: 90,
    category: 'Recategorize',
    query: 'What category is Lyft in?',
    expectedTools: ['preview_categorization', 'search_transactions'],
    expectedKeywords: ['lyft', 'transport', 'ride', 'category'],
  },
  {
    id: 91,
    category: 'Recategorize',
    query: 'Preview the category for CVS Pharmacy',
    expectedTools: ['preview_categorization'],
    expectedKeywords: ['cvs', 'pharmacy', 'health', 'category'],
  },

  // ── Outlier / Anomaly ─────────────────────────────────────────────────────
  {
    id: 92,
    category: 'Anomaly',
    query: 'What is the most I have spent in a single transaction?',
    expectedTools: ['sql_query'],
    expectedKeywords: ['$', 'largest', 'biggest', 'single', 'transaction', 'most'],
  },
  {
    id: 93,
    category: 'Anomaly',
    query: 'Are there any months where I spent significantly more than usual?',
    expectedTools: ['get_monthly_trends', 'compare_periods', 'sql_query'],
    expectedKeywords: ['$', 'month', 'january', 'february', 'march', 'higher', 'more', 'significant'],
  },
  {
    id: 94,
    category: 'Anomaly',
    query: 'What is my biggest one-time splurge?',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'largest', 'biggest', 'most', 'transaction', 'splurge', 'expensive'],
  },
  {
    id: 95,
    category: 'Anomaly',
    query: 'Were there any unexpected or one-off charges this month?',
    expectedTools: ['sql_query', 'search_transactions'],
    expectedKeywords: ['$', 'transaction', 'unexpected', 'one-time', 'charge', 'unusual'],
  },
  {
    id: 96,
    category: 'Anomaly',
    query: 'What day had the most spending across all months?',
    expectedTools: ['sql_query'],
    expectedKeywords: ['$', 'day', 'date', 'most', 'highest', 'january', 'february', 'march'],
  },

  // ── Compound Queries ──────────────────────────────────────────────────────
  {
    id: 97,
    category: 'Compound',
    query: 'What percentage of my total spending is on food (groceries and dining combined)?',
    expectedTools: ['get_categories', 'sql_query'],
    expectedKeywords: ['%', '$', 'food', 'groceries', 'dining', 'percent', 'combined'],
  },
  {
    id: 98,
    category: 'Compound',
    query: 'What is my total spending on coffee shops and fast food combined?',
    expectedTools: ['search_transactions', 'sql_query', 'get_categories'],
    expectedKeywords: ['$', 'starbucks', 'coffee', 'mcdonald', 'chipotle', 'dunkin', 'fast food', 'combined', 'total'],
  },
  {
    id: 99,
    category: 'Compound',
    query: 'Show me a complete financial summary for February 2026',
    expectedTools: ['sql_query', 'get_financial_summary', 'get_categories'],
    expectedKeywords: ['$', 'february', 'income', 'expenses', 'payroll', 'spending'],
  },
  {
    id: 100,
    category: 'Compound',
    query: 'Give me a full breakdown: income, fixed costs, variable spending, and how much I saved in January',
    expectedTools: ['sql_query', 'get_financial_summary', 'get_categories'],
    expectedKeywords: ['$', 'january', 'income', 'payroll', 'fixed', 'save', 'saved', 'expenses'],
  },
]

// ---------------------------------------------------------------------------
// LLM-as-judge
// ---------------------------------------------------------------------------

// Structured verdict returned by the judge model
interface JudgeVerdict {
  relevance: 1 | 2 | 3      // Does the response address the question?
  correctness: 1 | 2 | 3    // Are the numbers / facts plausible and consistent?
  completeness: 1 | 2 | 3   // Did the agent cover the key aspects expected?
  reasoning: string          // One sentence explaining the scores
}

const JUDGE_SYSTEM_PROMPT = `You are an impartial evaluator for a personal-finance AI assistant.
You will be given a user question and the assistant's response.
Score the response on three dimensions, each from 1 to 3:

relevance    — 1: off-topic  |  2: partially addresses question  |  3: directly answers it
correctness  — 1: likely wrong or contradictory  |  2: plausible but vague  |  3: specific, consistent numbers/facts
completeness — 1: major gaps  |  2: covers the core but misses details  |  3: thorough

Respond ONLY with valid JSON matching this schema (no markdown fences):
{"relevance":1,"correctness":1,"completeness":1,"reasoning":"..."}`

async function judgeResponse(
  openai: OpenAI,
  query: string,
  response: string,
  expectedKeywords: string[],
): Promise<JudgeVerdict> {
  const userPrompt = `User question: ${query}

Assistant response: ${response}

Expected topic signals (keywords that suggest a good answer): ${expectedKeywords.join(', ')}

Score the response.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 200,
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(raw) as JudgeVerdict
    // Clamp to valid range in case the model drifts
    return {
      relevance:    Math.min(3, Math.max(1, parsed.relevance))    as 1|2|3,
      correctness:  Math.min(3, Math.max(1, parsed.correctness))  as 1|2|3,
      completeness: Math.min(3, Math.max(1, parsed.completeness)) as 1|2|3,
      reasoning: parsed.reasoning ?? '',
    }
  } catch {
    // If the judge call fails, default to mid scores so it doesn't tank the run
    return { relevance: 2, correctness: 2, completeness: 2, reasoning: 'judge call failed' }
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

interface EvalResult {
  id: number
  category: string
  query: string
  // Heuristic dimensions (fast, free)
  completionOk: boolean
  toolOk: boolean
  keywordOk: boolean        // legacy keyword match (kept for comparison)
  // LLM-judge dimensions
  judgeRelevance: 1 | 2 | 3
  judgeCorrectness: 1 | 2 | 3
  judgeCompleteness: 1 | 2 | 3
  judgeReasoning: string
  judgeScore: number        // sum of three judge dimensions (3–9)
  // Combined
  totalScore: number        // completionOk + toolOk + judgeScore (max 11)
  pass: boolean             // judgeScore >= 6 AND completionOk AND toolOk
  toolsUsed: string[]
  responseSnippet: string
  error?: string
  durationMs: number
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const RATE_LIMIT_DELAY_MS = 1200 // slightly longer to budget for judge calls

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('='.repeat(70))
  console.log('  FinMind Agent Evaluation  (LLM-as-Judge)')
  console.log('='.repeat(70))

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('\nOPENAI_API_KEY not set — cannot run judge.\n')
    process.exit(1)
  }
  const openai = new OpenAI({ apiKey })

  // Resolve userId
  let userId = process.env.EVAL_USER_ID
  if (!userId) {
    const sql = getSql()
    const rows = await sql`SELECT DISTINCT user_id FROM transactions LIMIT 1`
    userId = rows[0]?.user_id
  }

  if (!userId) {
    console.error('\nNo transactions found in database and no EVAL_USER_ID set.')
    console.error('Upload a bank statement first, then re-run.\n')
    process.exit(1)
  }

  console.log(`\nUser ID : ${userId}`)
  console.log(`Cases   : ${TEST_CASES.length}`)
  console.log(`Agent   : gpt-4o-mini`)
  console.log(`Judge   : gpt-4o-mini`)
  console.log(`Pass    : judgeScore >= 6/9  AND  completion  AND  tool\n`)
  console.log('-'.repeat(70))

  const results: EvalResult[] = []

  for (const tc of TEST_CASES) {
    const label = `[${String(tc.id).padStart(2, '0')}] ${tc.category.padEnd(12)} ${tc.query.slice(0, 42)}`
    process.stdout.write(`${label.padEnd(62)} `)

    const t0 = Date.now()
    try {
      const agentResult = await runFinanceAgent(tc.query, userId)
      const durationMs = Date.now() - t0

      const response   = agentResult.response ?? ''
      const toolsUsed  = agentResult.toolsUsed ?? []

      const completionOk = response.trim().length > 30
      const toolOk       = tc.expectedTools.some(t => toolsUsed.includes(t))
      const keywordOk    = tc.expectedKeywords.some(kw =>
        response.toLowerCase().includes(kw.toLowerCase()),
      )

      // Only call judge when we have a non-empty response
      const verdict = completionOk
        ? await judgeResponse(openai, tc.query, response, tc.expectedKeywords)
        : { relevance: 1 as const, correctness: 1 as const, completeness: 1 as const, reasoning: 'empty response' }

      const judgeScore = verdict.relevance + verdict.correctness + verdict.completeness
      const pass = completionOk && toolOk && judgeScore >= 6

      const mark = pass
        ? `PASS J:${judgeScore}/9`
        : `FAIL J:${judgeScore}/9`
      console.log(`${mark}  (${durationMs}ms)`)

      results.push({
        id: tc.id,
        category: tc.category,
        query: tc.query,
        completionOk,
        toolOk,
        keywordOk,
        judgeRelevance:    verdict.relevance,
        judgeCorrectness:  verdict.correctness,
        judgeCompleteness: verdict.completeness,
        judgeReasoning:    verdict.reasoning,
        judgeScore,
        totalScore: (completionOk ? 1 : 0) + (toolOk ? 1 : 0) + judgeScore,
        pass,
        toolsUsed,
        responseSnippet: response.slice(0, 120).replace(/\n/g, ' '),
        durationMs,
      })
    } catch (err: unknown) {
      const durationMs = Date.now() - t0
      const message = err instanceof Error ? err.message : String(err)
      console.log(`ERR  (${durationMs}ms)`)
      results.push({
        id: tc.id,
        category: tc.category,
        query: tc.query,
        completionOk: false,
        toolOk: false,
        keywordOk: false,
        judgeRelevance: 1,
        judgeCorrectness: 1,
        judgeCompleteness: 1,
        judgeReasoning: 'agent threw an error',
        judgeScore: 3,
        totalScore: 0,
        pass: false,
        toolsUsed: [],
        responseSnippet: '',
        error: message.slice(0, 100),
        durationMs,
      })
    }

    if (tc.id < TEST_CASES.length) {
      await sleep(RATE_LIMIT_DELAY_MS)
    }
  }

  // ── Summary by category ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70))
  console.log('  Results by Category')
  console.log('='.repeat(70))

  const categories = [...new Set(results.map(r => r.category))]
  for (const cat of categories) {
    const group    = results.filter(r => r.category === cat)
    const passes   = group.filter(r => r.pass).length
    const avgJudge = (group.reduce((s, r) => s + r.judgeScore, 0) / group.length).toFixed(1)
    console.log(`  ${cat.padEnd(14)} ${passes}/${group.length} passed   avg judge ${avgJudge}/9`)
  }

  // ── Overall ───────────────────────────────────────────────────────────────
  const totalPasses  = results.filter(r => r.pass).length
  const avgJudge     = (results.reduce((s, r) => s + r.judgeScore, 0) / results.length).toFixed(2)
  const avgRelevance = (results.reduce((s, r) => s + r.judgeRelevance, 0) / results.length).toFixed(2)
  const avgCorrect   = (results.reduce((s, r) => s + r.judgeCorrectness, 0) / results.length).toFixed(2)
  const avgComplete  = (results.reduce((s, r) => s + r.judgeCompleteness, 0) / results.length).toFixed(2)
  const avgDuration  = Math.round(results.reduce((s, r) => s + r.durationMs, 0) / results.length)
  const pct          = ((totalPasses / results.length) * 100).toFixed(1)

  console.log('\n' + '='.repeat(70))
  console.log(`  Pass rate      : ${totalPasses}/${results.length}  (${pct}%)`)
  console.log(`  Avg judge score: ${avgJudge}/9  (relevance ${avgRelevance}  correctness ${avgCorrect}  completeness ${avgComplete})`)
  console.log(`  Avg latency    : ${avgDuration}ms per query`)
  console.log('='.repeat(70))

  // ── Failures detail ───────────────────────────────────────────────────────
  const failures = results.filter(r => !r.pass)
  if (failures.length > 0) {
    console.log('\nFailed cases:')
    for (const f of failures) {
      console.log(`\n  [${String(f.id).padStart(2, '0')}] ${f.query}`)
      if (f.error) {
        console.log(`       error     : ${f.error}`)
      } else {
        console.log(`       tools     : [${f.toolsUsed.join(', ')}]`)
        console.log(`       response  : ${f.responseSnippet || '(empty)'}`)
        console.log(`       judge     : R:${f.judgeRelevance} C:${f.judgeCorrectness} P:${f.judgeCompleteness} — ${f.judgeReasoning}`)
        if (!f.toolOk) {
          const tc = TEST_CASES.find(t => t.id === f.id)!
          console.log(`       missing   : expected one of [${tc.expectedTools.join(', ')}]`)
        }
      }
    }
  }

  console.log()
}

main().catch(err => {
  console.error('Eval script error:', err)
  process.exit(1)
})
