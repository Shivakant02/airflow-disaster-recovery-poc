#!/bin/bash

echo "🧪 Testing Disaster Recovery API"
echo "================================="
echo ""

API_URL="http://localhost:3000"

# Test health check
echo "1️⃣  Testing Health Check..."
curl -s ${API_URL}/health | jq .
echo ""

# Test system status
echo "2️⃣  Testing System Status..."
curl -s ${API_URL}/api/disaster-recovery/status | jq .
echo ""

# Test get all DAGs
echo "3️⃣  Getting All DAGs..."
curl -s ${API_URL}/api/dags | jq '.dags[] | {dag_id, is_paused, is_active}'
echo ""

# Test pause DAG
echo "4️⃣  Pausing disaster_recovery_dag_1..."
curl -s -X POST ${API_URL}/api/disaster-recovery/pause/disaster_recovery_dag_1 | jq .
echo ""

# Wait a bit
sleep 2

# Test unpause DAG
echo "5️⃣  Unpausing disaster_recovery_dag_1..."
curl -s -X POST ${API_URL}/api/disaster-recovery/unpause/disaster_recovery_dag_1 | jq .
echo ""

# Test run DAG
echo "6️⃣  Running disaster_recovery_dag_1..."
curl -s -X POST ${API_URL}/api/disaster-recovery/run/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{"conf": {"environment": "test", "batch_id": "001"}}' | jq .
echo ""

# Test trigger DAG
echo "7️⃣  Triggering/Rerunning disaster_recovery_dag_2..."
curl -s -X POST ${API_URL}/api/disaster-recovery/trigger/disaster_recovery_dag_2 \
  -H "Content-Type: application/json" \
  -d '{"conf": {"test": "disaster_recovery_test"}}' | jq .
echo ""

# Test get DAG runs
echo "8️⃣  Getting DAG Runs for disaster_recovery_dag_1..."
curl -s "${API_URL}/api/disaster-recovery/runs/disaster_recovery_dag_1?limit=5" | jq '.dag_runs[] | {dag_run_id, state, start_date}'
echo ""

echo "================================="
echo "✅ Tests completed!"
echo ""
echo "💡 Tips:"
echo "   - Visit http://localhost:8080 to see DAGs in Airflow UI"
echo "   - Use Postman or curl to test other endpoints"
echo "   - Check README.md for complete API documentation"
