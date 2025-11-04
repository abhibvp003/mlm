#!/bin/bash

echo "🚀 Starting MLM System..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   brew services start mongodb-community"
    echo "   or"
    echo "   sudo systemctl start mongod"
    echo ""
    read -p "Press Enter to continue anyway (MongoDB connection will fail)..."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

echo "✅ Dependencies installed!"
echo ""
echo "🌐 Starting development servers..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers
npm run dev
