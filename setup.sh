#!/bin/bash

echo "🔧 Setting up MLM System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   macOS: brew install mongodb-community"
    echo "   Ubuntu: sudo apt-get install mongodb"
    echo "   Windows: Download from https://www.mongodb.com/try/download/community"
fi

echo "📦 Installing dependencies..."
npm run install-all

echo "🌱 Seeding database with sample data..."
cd server && npm run seed && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   ./start.sh"
echo ""
echo "📋 Or manually:"
echo "   npm run dev"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://152.59.144.69:3000"
echo "   Backend:  http://152.59.144.69:5001"
echo ""
echo "👤 Default login credentials:"
echo "   Admin: admin@mlm.com / admin123"
echo "   User:  john@example.com / password123"
