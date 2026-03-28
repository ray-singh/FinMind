# FinMind: Personal Finance Auto-Pilot

An AI Agent-powered financial assistant that allows users to upload bank statements (CSV) and chat with their data using natural language. The system autonomously categorizes transactions and generates SQL queries to answer your financial questions.

## Architecture

![Architecture Diagram](architecture.svg)

## Features

### Authentication & Multi-Tenancy
- **Clerk Integration**: Enterprise-grade authentication with email/password and social login
- **Multi-User Support**: Complete data isolation — each user only sees their own data
- **Protected Routes**: All financial data and API endpoints are secured and user-scoped
- **Per-User OpenAI Keys**: Users supply their own API key via an onboarding modal after login; keys are encrypted at rest with AES-256-GCM

### AI Agent System
- **LangGraph Agent**: 11 specialized tools for financial analysis with a 10-iteration safety cap to prevent runaway loops
- **Autonomous Tool Selection**: Agent automatically chooses the right tools for each question
- **Multi-Step Reasoning**: Plans complex queries, executes multiple tools, and synthesizes results
- **Tool Transparency**: See exactly which tools the agent used to answer your question

### Core Capabilities
- **Smart CSV Upload**: Upload bank statements with automatic parsing and flexible column detection; raw files are archived to AWS S3
- **Autonomous Categorization**: 200+ built-in pattern rules automatically categorize transactions across 20+ categories
- **Natural Language Chat**: Ask questions in plain English — "How much did I spend on coffee this month?"
- **Interactive Visualizations**: Pie, bar, and line charts appear automatically in chat responses when relevant
- **Comprehensive Dashboard**: Spending by category, monthly trends, and top merchants
- **Transaction Management**: View, search, filter, edit, and delete transactions with pagination
- **Category Rules Management**: Add custom categorization patterns that auto-apply to existing transactions

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend** | Next.js 14 | React framework with App Router |
| **Language** | TypeScript 5.3 | Type-safe development |
| **Authentication** | Clerk | User auth and session management |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Database** | NeonDB + Drizzle ORM | Serverless PostgreSQL with type-safe ORM |
| **Vector Search** | pgvector | Native PostgreSQL vector similarity search |
| **AI/ML** | OpenAI GPT-4o-mini | Agent reasoning, SQL generation, categorization |
| **Agent Framework** | LangChain + LangGraph | Multi-step agent orchestration and tool calling |
| **File Storage** | AWS S3 | CSV bank statement archive (optional) |
| **Encryption** | Node.js `crypto` (AES-256-GCM) | API key encryption at rest |
| **Visualization** | Recharts | Interactive charts and graphs |
| **CSV Parsing** | PapaParse | Robust CSV file handling |
| **Icons** | Lucide React | Consistent icon set |

## Quick Start

### Prerequisites

- Node.js 18+
- A [NeonDB](https://console.neon.tech) database
- A [Clerk](https://dashboard.clerk.com) application
- An OpenAI API key (optional at the server level — users can supply their own via the dashboard)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Personal-Finance-Auto-Pilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and fill in your keys:
   ```env
   # OpenAI — optional if all users will supply their own keys
   OPENAI_API_KEY=sk-proj-...

   # NeonDB
   DATABASE_URL=postgresql://user:password@ep-....neon.tech/neondb?sslmode=require

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Encryption key for user API keys stored in the database
   # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ENCRYPTION_KEY=<64-char hex string>

   # AWS S3 — optional, CSV uploads are processed in-memory if omitted
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET=...
   ```

4. **Push the database schema**
   ```bash
   npm run db:push
   ```

5. **Configure Clerk** (first-time only)
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com) and create an application
   - Under **Paths**, set:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in URL: `/dashboard`
     - After sign-up URL: `/dashboard`

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## AI Agent

The agent is built on LangGraph with a state machine that loops until it has enough information to respond, capped at 10 iterations.

**Workflow:**
```
User Query → Agent → Tool Selection → Tool Execution → Agent (re-evaluate)
                ^                                            |
                └──────── iterate until answer ready ───────┘
                                    |
                          Response Formatter → Final Answer
```

**Available Tools:**

| Tool | Description |
|------|-------------|
| `sql_query` | Execute read-only SQL for custom analysis |
| `get_categories` | List all categories with counts and totals |
| `get_financial_summary` | Overview stats, filterable by timeframe |
| `get_monthly_trends` | Income vs expenses over time |
| `search_transactions` | Find transactions by description and/or category (SQL-pushed filters) |
| `compare_periods` | Compare spending across two time periods, with optional category scoping |
| `recategorize_transactions` | Preview bulk category updates |
| `find_similar_transactions` | Semantic search via pgvector |
| `retrieve_context` | RAG retrieval for spending pattern context |
| `preview_categorization` | Show what category would be assigned to a merchant |
| `learn_category` | Create a categorization rule from a user correction |

## Security

- All routes under `/dashboard` and `/api/*` require an authenticated Clerk session
- Every database query is scoped to the authenticated `userId` — users cannot access each other's data
- User-supplied OpenAI API keys are encrypted with AES-256-GCM (random IV per write) before storage; legacy plaintext values are handled transparently on read
- The `ENCRYPTION_KEY` and all secret credentials are server-side only and never sent to the client
- AWS S3 uploads are scoped per user: `uploads/{userId}/{timestamp}-{filename}`

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/upload` | POST | Parse and import a CSV bank statement |
| `/api/query` | POST | Run a natural language query through the LangGraph agent |
| `/api/transactions` | GET / POST / DELETE | List, create, or delete transactions |
| `/api/analytics` | GET | Dashboard summary data |
| `/api/categories` | GET / POST / DELETE | Manage categorization rules |
| `/api/recategorize` | POST / GET | Apply smart recategorization in bulk |
| `/api/user-settings` | GET / POST | Read and save per-user settings (e.g. OpenAI API key) |

## Example Queries

**Spending summaries**
- "What's my total spending this month?"
- "What are my top 3 expense categories?"
- "What percentage of my spending is on dining?"

**Comparisons**
- "Compare my spending this month to last month"
- "How much did I spend on coffee compared to last month?"

**Time-based analysis**
- "Show my spending by month for the last 6 months"
- "What are my spending trends over time?"

**Transaction search**
- "Find all Starbucks transactions"
- "Show me transactions over $100 in the shopping category"

**Category management**
- "Starbucks should be categorized as Coffee"
- "Recategorize all my uncategorized transactions"

## Contributing

Contributions are welcome.

```bash
git checkout -b feature/your-feature-name
# Make your changes
npm run dev   # Test locally
npm run build # Verify the build passes
# Open a pull request
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [OpenAI](https://openai.com/)
- [LangChain](https://js.langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraphjs/)
- [Clerk](https://clerk.com/)
- [NeonDB](https://neon.tech/)
- [AWS S3](https://aws.amazon.com/s3/)
- [Recharts](https://recharts.org/)
- [Lucide](https://lucide.dev/)
