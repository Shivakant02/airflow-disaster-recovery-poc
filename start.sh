#!/bin/bash

echo "🚀 Starting Multi-Client Disaster Recovery System for Airflow 2.11.0"
echo "================================================================="
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p dags logs plugins config
mkdir -p dags-client3 logs-client3

# Set proper permissions
export AIRFLOW_UID=50000
echo "AIRFLOW_UID=${AIRFLOW_UID}" > .env

# Fix permissions for Airflow directories
echo "🔐 Setting permissions..."
sudo chown -R 50000:50000 dags logs dags-client3 logs-client3 2>/dev/null || true

echo ""
echo "📦 Starting Docker containers..."
echo ""

# Start Client1 (Production Airflow - Port 8080)
echo "Starting Client1 (Production Airflow on port 8080)..."
docker compose -f docker-compose.yaml up -d

# Start Client3 (Development Airflow - Port 8082)
echo "Starting Client3 (Development Airflow on port 8082)..."
docker compose -f docker-compose-client3.yaml up -d

echo ""
echo "⏳ Waiting for services to start (this may take 2-3 minutes)..."
echo ""

# Wait for Client1 Airflow webserver to be ready
echo "Waiting for Client1 (Production) webserver on port 8080..."
for i in {1..60}; do
  if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Client1 (Production) is ready!"
    break
  fi
  echo -n "."
  sleep 5
done

echo ""
# Wait for Client3 Airflow webserver to be ready
echo "Waiting for Client3 (Development) webserver on port 8082..."
for i in {1..60}; do
  if curl -s http://localhost:8082/health > /dev/null 2>&1; then
    echo "✅ Client3 (Development) is ready!"
    break
  fi
  echo -n "."
  sleep 5
done

echo ""
echo "🚀 Starting Multi-Client Disaster Recovery API on port 3001..."

# Kill any existing node processes on port 3001
pkill -f "PORT=3001 node" 2>/dev/null || true
sleep 2

# Start the API server
PORT=3001 node src/index.js > api-server.log 2>&1 &
API_PID=$!
echo "API server started with PID: $API_PID"

echo ""
echo "Waiting for Multi-Client API..."
for i in {1..30}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Multi-Client API is ready!"
    break
  fi
  echo -n "."
  sleep 2
done

echo ""
echo "================================================================="
echo "✅ Multi-Client System is ready!"
echo "================================================================="
echo ""
echo "🌐 Airflow Instances:"
echo "   Client1 (Production): http://localhost:8080"
echo "   Client3 (Development): http://localhost:8082"
echo "   Username: airflow"
echo "   Password: airflow"
echo ""
echo "🔧 Multi-Client Disaster Recovery API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo "   List Clients: http://localhost:3001/api/clients"
echo "   System Status: http://localhost:3001/api/disaster-recovery/status"
echo ""
echo "� DAG Information:"
echo "   Client1 has 2 DAGs: disaster_recovery_dag_1, disaster_recovery_dag_2"
echo "   Client3 has 2 DAGs: dev_testing_pipeline_dag_1, dev_testing_pipeline_dag_2"
echo ""
echo "💡 Query Examples:"
echo "   # Get DAGs from Client1 only"
echo "   curl \"http://localhost:3001/api/dags?clients=client1\""
echo ""
echo "   # Get DAGs from both clients"
echo "   curl \"http://localhost:3001/api/dags?clients=client1,client3\""
echo ""
echo "   # Run DAG on both clients"
echo "   curl -X POST \"http://localhost:3001/api/disaster-recovery/run/disaster_recovery_dag_1?clients=client1,client3\""
echo ""
echo "📚 View logs:"
echo "   # Docker logs"
echo "   docker compose logs -f airflow-webserver"
echo "   docker compose -f docker-compose-client3.yaml logs -f airflow-webserver-client3"
echo ""
echo "   # API logs"
echo "   tail -f api-server.log"
echo ""
echo "🛑 Stop services:"
echo "   ./stop.sh"
echo "   # OR manually:"
echo "   docker compose down"
echo "   docker compose -f docker-compose-client3.yaml down"
echo "   pkill -f 'PORT=3001 node'"
echo ""
echo "================================================================="
