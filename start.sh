#!/bin/bash

# GitEval Start Script
# Starts both frontend and backend services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to cleanup background processes
cleanup() {
    print_info "Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_info "Backend stopped (PID: $BACKEND_PID)"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_info "Frontend stopped (PID: $FRONTEND_PID)"
    fi
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_warning "Supabase CLI is not installed. Skipping Supabase startup."
    print_info "Install with: brew install supabase/tap/supabase"
else
    # Check if Supabase is already running
    if supabase status &> /dev/null; then
        print_info "Supabase is already running"
    else
        print_info "Starting Supabase..."
        if supabase start; then
            print_success "Supabase started successfully"
        else
            print_warning "Failed to start Supabase. Make sure Docker Desktop is running."
            print_info "You can start Supabase manually with: supabase start"
        fi
    fi
fi

print_info "Starting GitEval application..."
echo ""

# Check if node_modules exist, if not, install dependencies
if [ ! -d "backend/node_modules" ]; then
    print_warning "Backend dependencies not found. Installing..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    print_warning "Frontend dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
fi

# Start backend
print_info "Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
print_success "Backend started (PID: $BACKEND_PID)"
print_info "Backend logs: tail -f backend.log"

# Wait a moment for backend to start
sleep 2

# Start frontend
print_info "Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
print_success "Frontend started (PID: $FRONTEND_PID)"
print_info "Frontend logs: tail -f frontend.log"

echo ""
print_success "Both services are running!"
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:3001"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo ""
print_info "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
