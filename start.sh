#!/bin/bash

# EmailPay Startup Script
# This script helps you get EmailPay running quickly

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                    EmailPay Startup                       ║"
echo "║          Email-Native PYUSD Wallet System                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js installation
echo "🔍 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. You have: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your credentials:"
    echo "   - Gmail API credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)"
    echo "   - Infura/Alchemy RPC endpoint"
    echo "   - Your Gmail address"
    echo ""
    echo "📖 See SETUP_GUIDE.md for detailed instructions"
    echo ""
    read -p "Press Enter when you've configured .env..."
fi

# Check if frontend .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local..."
    mkdir -p frontend
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
    echo "✅ frontend/.env.local created"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    echo "✅ Backend dependencies installed"
    echo ""
else
    echo "✅ Backend dependencies already installed"
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
    echo ""
else
    echo "✅ Frontend dependencies already installed"
fi

# Create data directory if it doesn't exist
mkdir -p data

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                   Starting EmailPay...                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Backend will start on: http://localhost:3001"
echo "🌐 Frontend will start on: http://localhost:3000"
echo ""
echo "📧 To test:"
echo "   1. Open http://localhost:3000"
echo "   2. Create a wallet with your email"
echo "   3. Verify with the OTP sent to your email"
echo "   4. Send an email command to test payments"
echo ""
echo "📖 Documentation:"
echo "   • Quick Start: QUICKSTART.md"
echo "   • Full Setup: SETUP_GUIDE.md"
echo "   • Architecture: ARCHITECTURE.md"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Start the application
npm run dev
