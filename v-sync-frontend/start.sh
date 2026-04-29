#!/bin/bash

echo "🚀 Starting Contract Intelligence Platform..."
echo ""

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set in environment"
    echo "Set it with: export ANTHROPIC_API_KEY=sk-ant-..."
    echo ""
fi

# Start backend in background
echo "Starting backend on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo ""
echo "Starting frontend on port 3000..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
