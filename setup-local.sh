#!/bin/bash

# Nexus AI Assistant - Local Setup Script
# This script sets up Nexus for local development

set -e

echo "🚀 Nexus AI Assistant - Local Setup"
echo "===================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ Node.js and pnpm are installed"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

echo "✅ Dependencies installed"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Local Development Environment Variables

# Database Configuration
DATABASE_URL="mysql://nexus:nexus_password@localhost:3306/nexus_ai"

# JWT Secret (min 32 characters)
JWT_SECRET="your-secret-key-here-min-32-chars-long-enough"

# OAuth Configuration (for local dev)
VITE_APP_ID="local-dev"
VITE_OAUTH_PORTAL_URL="http://localhost:3000"
OAUTH_SERVER_URL="http://localhost:3000"

# Owner Configuration
OWNER_NAME="Developer"
OWNER_OPEN_ID="local-dev-user"

# Manus API (optional - for advanced features)
BUILT_IN_FORGE_API_URL="http://localhost:3000"
BUILT_IN_FORGE_API_KEY="local-dev-key"
VITE_FRONTEND_FORGE_API_URL="http://localhost:3000"
VITE_FRONTEND_FORGE_API_KEY="local-dev-key"

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT="http://localhost:3000/analytics"
VITE_ANALYTICS_WEBSITE_ID="local-dev"

# App Configuration
VITE_APP_TITLE="Nexus AI Assistant"
VITE_APP_LOGO="https://example.com/logo.png"
EOF
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Set up MySQL Database:"
echo "   - Start MySQL: brew services start mysql (macOS) or sudo systemctl start mysql (Linux)"
echo "   - Create database:"
echo "     mysql -u root -p"
echo "     CREATE DATABASE nexus_ai;"
echo "     CREATE USER 'nexus'@'localhost' IDENTIFIED BY 'nexus_password';"
echo "     GRANT ALL PRIVILEGES ON nexus_ai.* TO 'nexus'@'localhost';"
echo "     FLUSH PRIVILEGES;"
echo ""
echo "2. Initialize database schema:"
echo "   pnpm db:push"
echo ""
echo "3. Start development server:"
echo "   pnpm dev"
echo ""
echo "4. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more details, see LOCAL_SETUP.md"
echo ""
