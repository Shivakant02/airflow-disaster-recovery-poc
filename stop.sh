#!/bin/bash

echo "🛑 Stopping Multi-Client Disaster Recovery System..."
echo "=================================================="
echo ""

# Stop API server
echo "Stopping Multi-Client API server..."
pkill -f "PORT=3001 node" 2>/dev/null && echo "✅ API server stopped" || echo "⚠️  No API server running"

# Stop Client1 (Production)
echo ""
echo "Stopping Client1 (Production Airflow)..."
docker compose -f docker-compose.yaml down

# Stop Client3 (Development)
echo ""
echo "Stopping Client3 (Development Airflow)..."
docker compose -f docker-compose-client3.yaml down

echo ""
echo "=================================================="
echo "✅ All services stopped!"
echo ""
echo "💡 To start again, run: ./start.sh"
echo "=================================================="
