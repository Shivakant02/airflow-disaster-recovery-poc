#!/bin/bash

echo "======================================"
echo "Multi-Client Airflow API Test Script"
echo "======================================"
echo ""

# Wait for all services to be ready
echo "Checking service health..."
echo ""

echo "Client 1 (Production - Port 8080):"
curl -s http://localhost:8080/health | head -1
echo ""

echo "Client 2 (Staging - Port 8081):"
curl -s http://localhost:8081/health | head -1 || echo "  ⏳ Still starting up..."
echo ""

echo "Client 3 (Development - Port 8082):"
curl -s http://localhost:8082/health | head -1 || echo "  ⏳ Still starting up..."
echo ""

echo "======================================"
echo "Testing Multi-Client API"
echo "======================================"
echo ""

echo "1. List all configured clients:"
curl -s http://localhost:3000/api/clients | python3 -m json.tool
echo ""

echo "2. Get DAGs from Client1 only:"
curl -s "http://localhost:3000/api/dags?clients=client1" | python3 -m json.tool
echo ""

echo "3. Get system status from all clients:"
curl -s "http://localhost:3000/api/disaster-recovery/status" | python3 -m json.tool
echo ""

echo "4. Get DAGs from Client1 and Client2:"
curl -s "http://localhost:3000/api/dags?clients=client1,client2" | python3 -m json.tool
echo ""

echo "5. Run a DAG on multiple clients (client1,client2):"
curl -s -X POST "http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1?clients=client1,client2" \
  -H "Content-Type: application/json" \
  -d '{"conf": {"source": "multi-client-test"}}' | python3 -m json.tool
echo ""

echo "======================================"
echo "Test Complete!"
echo "======================================"
