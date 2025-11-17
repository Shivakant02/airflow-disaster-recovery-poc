# Quick Start Guide

## 🚀 Start the System

```bash
./start.sh
```

Or manually:

```bash
docker-compose up -d
```

## 🧪 Test the API

```bash
./test-api.sh
```

## 📊 Access Points

- **Airflow UI**: http://localhost:8080 (airflow/airflow)
- **API**: http://localhost:3000
- **Health**: http://localhost:3000/health
- **Status**: http://localhost:3000/api/disaster-recovery/status

## 🔥 Common Operations

### Pause a DAG

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/pause/disaster_recovery_dag_1
```

### Resume a DAG

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/unpause/disaster_recovery_dag_1
```

### Run a DAG

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1
```

With configuration:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{"conf": {"environment": "production"}}'
```

### Trigger a DAG Run (Rerun)

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/trigger/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{"logical_date": "2025-11-17T10:00:00Z"}'
```

### Get System Status

```bash
curl http://localhost:3000/api/disaster-recovery/status | jq
```

### View DAG Runs

```bash
curl http://localhost:3000/api/disaster-recovery/runs/disaster_recovery_dag_1 | jq
```

### Clear Failed Tasks

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/clear/disaster_recovery_dag_1/RUN_ID \
  -H "Content-Type: application/json" \
  -d '{"only_failed": true}'
```

### Pause All DAGs (Emergency)

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/pause-all
```

### Resume All DAGs

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/unpause-all
```

## 📝 View Logs

```bash
# API logs
docker-compose logs -f disaster-recovery-api

# Airflow webserver logs
docker-compose logs -f airflow-webserver

# Airflow scheduler logs
docker-compose logs -f airflow-scheduler

# All logs
docker-compose logs -f
```

## 🛑 Stop System

```bash
docker-compose down
```

Remove volumes too:

```bash
docker-compose down -v
```

## 🔍 Debug

### Check if services are running

```bash
docker-compose ps
```

### Check Airflow DAGs

```bash
docker-compose exec airflow-webserver airflow dags list
```

### Check DAG errors

```bash
docker-compose exec airflow-webserver airflow dags list-import-errors
```

### Execute commands in Airflow

```bash
docker-compose exec airflow-webserver bash
```

## 📦 DAGs Included

1. **disaster_recovery_dag_1** - Data processing pipeline

   - Runs: Hourly
   - Tasks: start → process_data_batch_1 → process_data_batch_2 → end

2. **disaster_recovery_dag_2** - Backup and validation
   - Runs: Hourly
   - Tasks: start → create_backup → validate_backup → end

## 🎯 Disaster Recovery Scenarios

### Scenario 1: Single DAG Failure

1. Check status: `GET /api/disaster-recovery/status`
2. View runs: `GET /api/disaster-recovery/runs/:dag_id`
3. Clear failed tasks: `POST /api/disaster-recovery/clear/:dag_id/:run_id`

### Scenario 2: System Maintenance

1. Pause all: `POST /api/disaster-recovery/pause-all`
2. Perform maintenance
3. Resume all: `POST /api/disaster-recovery/unpause-all`

### Scenario 3: Manual Rerun

1. Trigger: `POST /api/disaster-recovery/trigger/:dag_id`
2. Monitor: `GET /api/disaster-recovery/runs/:dag_id/:run_id`
3. Check logs: `GET /api/disaster-recovery/logs/:dag_id/:run_id/:task_id`

## 📮 Postman Collection

Import `Disaster-Recovery-API.postman_collection.json` into Postman for easy testing.

## 💡 Tips

- Wait 2-3 minutes after starting for full initialization
- Check logs if DAGs don't appear
- Use `jq` for pretty JSON output
- Monitor system status regularly
- Always test pause/unpause on non-critical DAGs first
