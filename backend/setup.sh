#!/bin/bash

# Jashoo Backend Setup Script
# This script sets up the backend development environment

echo "🚀 Setting up Jashoo Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Run: sudo systemctl start mongod (Linux) or brew services start mongodb (macOS)"
    exit 1
fi

echo "✅ MongoDB is running"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Initialize database
echo "🗄️  Initializing database..."
npm run init-db

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

echo "✅ Database initialized"

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but continuing setup..."
else
    echo "✅ All tests passed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Start the development server: npm run dev"
echo "   3. API will be available at: http://localhost:3000"
echo "   4. Health check: http://localhost:3000/health"
echo ""
echo "📚 Documentation:"
echo "   - API docs: README.md"
echo "   - Environment variables: .env.example"
echo ""
echo "🔧 Development commands:"
echo "   - npm run dev     # Start development server"
echo "   - npm start       # Start production server"
echo "   - npm test        # Run tests"
echo "   - npm run init-db # Reinitialize database"
echo ""
echo "Happy coding! 🚀"