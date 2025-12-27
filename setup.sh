#!/bin/bash

# Personal Finance Auto-Pilot - Setup Script
echo "🚀 Personal Finance Auto-Pilot - Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Setup environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your OpenAI API key!"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Create data directory
if [ ! -d data ]; then
    mkdir -p data
    echo "✅ Created data directory"
fi

echo ""
echo "======================================"
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your OPENAI_API_KEY"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo "4. Upload the sample CSV from: sample-data/bank-statement-sample.csv"
echo ""
echo "For more information, see README.md or QUICKSTART.md"
echo "======================================"
