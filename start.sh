#!/bin/bash

# Navigate to script's directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Free up ports 8000 and 5173 if previously running
echo "🧹 Checking ports 8000 and 5173..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Cleanup background processes on exit (Ctrl+C)
trap 'echo -e "\n🛑 Stopping servers..."; kill $(jobs -p) 2>/dev/null; exit 0' SIGINT SIGTERM EXIT

echo "=================================================="
echo "🚀 Starting Syllabus AI Tutor..."
echo "=================================================="

# Start backend
echo "⚡ Starting Backend on http://localhost:8000 (Docs: http://localhost:8000/docs)..."
cd "$DIR/backend"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a brief moment for backend to initialize
sleep 2

# Start frontend
echo "🎨 Starting Frontend on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ Both servers are running!"
echo "👉 Open http://localhost:5173 in your browser"
echo "👉 Press Ctrl + C to stop both servers anytime"
echo "=================================================="

# Wait for both processes
wait
