#!/bin/bash

echo "🚀 Starting Disaster Recovery System for Airflow 2.11.0"
echo "=================================================="
echo ""

# Create necessary directories
mkdir -p dags logs plugins config

# Set proper permissions
export AIRFLOW_UID=50000
echo "AIRFLOW_UID=${AIRFLOW_UID}" > .env
cat << EOF >> .env
AIRFLOW_URL=http://localhost:8080
AIRFLOW_USERNAME=airflow
AIRFLOW_PASSWORD=airflow
EOF

echo "📦 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start (this may take 2-3 minutes)..."
echo ""

# Wait for Airflow webserver to be ready
echo "Waiting for Airflow webserver..."
for i in {1..60}; do
  if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Airflow webserver is ready!"
    break
  fi
  echo -n "."
  sleep 5
done

echo ""
echo "Waiting for Disaster Recovery API..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Disaster Recovery API is ready!"
    break
  fi
  echo -n "."
  sleep 2
done

echo ""
echo "=================================================="
echo "✅ System is ready!"
echo ""
echo "🌐 Access URLs:"
echo "   Airflow Web UI: http://localhost:8080"
echo "   Username: airflow"
echo "   Password: airflow"
echo ""
echo "   Disaster Recovery API: http://localhost:3000"
echo "   Health Check: http://localhost:3000/health"
echo "   Status: http://localhost:3000/api/disaster-recovery/status"
echo ""
echo "📚 View logs:"
echo "   docker-compose logs -f airflow-webserver"
echo "   docker-compose logs -f airflow-scheduler"
echo "   docker-compose logs -f disaster-recovery-api"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo "=================================================="
