#!/bin/bash

# NextTS Portfolio - Environment Setup Script
# This ensures consistent Node.js/pnpm versions across different machines

echo "🔧 Setting up NextTS Portfolio environment..."

# Check if .nvmrc exists
if [ -f ".nvmrc" ]; then
    echo "📦 Found .nvmrc file"
    
    # Check if nvm is available
    if command -v nvm &> /dev/null; then
        echo "🔄 Using NVM to set Node.js version..."
        nvm use
        nvm install
    else
        echo "⚠️  NVM not found. Please ensure Node.js $(cat .nvmrc) is installed."
        echo "    Current Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"
    fi
else
    echo "⚠️  .nvmrc file not found"
fi

# Check Node.js version
if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js 18.17.0+"
    exit 1
fi

# Check yarn
if command -v yarn &> /dev/null; then
    echo "✅ Yarn version: $(yarn --version)"
else
    echo "❌ Yarn not found. Installing yarn globally..."
    npm install -g yarn
fi

# Install dependencies locally
echo "📥 Installing project dependencies..."
pnpm install

echo "🎉 Environment setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev       - Start development server"
echo "  pnpm build     - Build for production"
echo "  pnpm typecheck - Run TypeScript checks"
echo "  pnpm lint      - Run ESLint"
echo "  pnpm test      - Run tests" 