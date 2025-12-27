# Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

This will install all required packages including:
- Next.js 14 (framework)
- React 18 (UI library)
- TypeScript (type safety)
- better-sqlite3 (database)
- OpenAI (AI integration)
- LangChain/LangGraph (AI Agent framework)
- Clerk (authentication)
- Recharts (data visualization)
- PapaParse (CSV parsing)
- Tailwind CSS (styling)

### Step 2: Configure Environment Variables

1. Get your OpenAI API key from: https://platform.openai.com/api-keys
2. Get your Clerk keys from: https://dashboard.clerk.com
3. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
4. Edit `.env.local` and add your keys:
   ```
   OPENAI_API_KEY=sk-proj-...your-key-here
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...your-key-here
   CLERK_SECRET_KEY=sk_test_...your-key-here
   ```

### Step 3: Run the Development Server
```bash
npm run dev
```

The app will be available at: http://localhost:3000

### Step 4: Create an Account

1. Open http://localhost:3000
2. Click "Get Started Free" to create an account
3. Complete the sign-up process

### Step 5: Upload Sample Data

1. After signing in, you'll be at the Dashboard
2. Click the "Upload Data" tab
3. Select the file: `sample-data/bank-statement-sample.csv`
4. Click "Upload and Process"
5. Wait for success message

### Step 6: Start Chatting

1. Switch to the "AI Chat" tab
2. Try asking:
   - "How much did I spend on coffee?"
   - "What are my top spending categories?"
   - "Show me all transactions over $50"

### Step 6: View Dashboard

Click the "Dashboard" tab to see:
- Total transactions and expenses
- Spending by category (pie chart)
- Monthly trends (line chart)
- Recent transactions
- Top merchants

## CSV Format Requirements

Your bank statement CSV should have these columns:

### Required Columns:
- **Date**: Transaction date (YYYY-MM-DD, MM/DD/YYYY, etc.)
- **Description**: Merchant or transaction description
- **Amount**: Transaction amount (negative for expenses, positive for income)

### Optional Columns:
- **Account**: Account name (Checking, Credit Card, etc.)
- **Category**: Pre-categorized (will be auto-categorized if not provided)

### Example:
```csv
Date,Description,Amount,Account
2024-12-01,SQ *STARBUCKS COFFEE,-5.50,Checking
2024-12-02,PAYROLL DEPOSIT,3500.00,Checking
2024-12-03,WHOLE FOODS MARKET,-85.23,Credit Card
```

## Common Issues

### Issue: "OpenAI API key not configured"
**Solution**: Make sure `.env.local` exists with your API key

### Issue: CSV upload fails
**Solution**: Check that your CSV has Date, Description, and Amount columns

### Issue: Database errors
**Solution**: Delete the `data/` folder and restart the app

### Issue: Port 3000 already in use
**Solution**: Run `npm run dev -- -p 3001` to use port 3001

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  ┌────────┐      ┌────────┐      ┌─────────────┐       │
│  │ Upload │      │  Chat  │      │  Dashboard  │       │
│  └────────┘      └────────┘      └─────────────┘       │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────┐    ┌──────────────┐  ┌──────────┐
│  Upload  │    │   Query API  │  │Analytics │
│   API    │    │ (Text-to-SQL)│  │   API    │
└──────────┘    └──────────────┘  └──────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
        ┌───────────────────────────────┐
        │      SQLite Database          │
        │  ┌──────────────────────┐     │
        │  │   transactions       │     │
        │  │   category_rules     │     │
        │  └──────────────────────┘     │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │    Categorization Engine      │
        │  (Pattern Matching + AI)      │
        └───────────────────────────────┘
```

## Key Components

### 1. Upload System
- Parses CSV files with PapaParse
- Validates data structure
- Inserts into SQLite database
- Applies autonomous categorization

### 2. Text-to-SQL Engine
- Receives natural language query
- Sends to OpenAI GPT-4 with database schema
- Generates SQL query
- Executes query safely (read-only)
- Formats results into natural language

### 3. Categorization System
- Pattern-based matching (e.g., "STARBUCKS" → "Coffee")
- 35+ predefined category rules
- Extensible rule system
- Fallback to "Other" for unknown merchants

### 4. Visualization Dashboard
- Real-time analytics
- Multiple chart types (pie, line, bar)
- Interactive tooltips
- Responsive design

## Next Steps

### Customize Categories
Edit `lib/database.ts` to add more category rules:
```typescript
['PATTERN', 'Category'],
['YOUR MERCHANT', 'Your Category'],
```

### Add More Visualizations
Edit `components/Dashboard.tsx` to add custom charts

### Extend SQL Capabilities
Modify `lib/textToSQL.ts` to enhance query generation

### Deploy to Production
```bash
npm run build
npm start
```

## Getting Help

- Check the main README.md for detailed documentation
- Review the sample CSV in `sample-data/`
- Inspect the generated SQL queries in the chat interface
- Check browser console for errors

---

Happy analyzing! 🚀
