# Disaster Recovery API - Complete Endpoint Reference

## 🚀 DAG Execution Endpoints

### Run DAG (NEW!)

**Endpoint**: `POST /api/disaster-recovery/run/:dag_id`

**Purpose**: Start a new DAG run immediately

**Use When**:

- ✅ You want to execute the DAG right now
- ✅ Manual trigger with custom configuration
- ✅ Normal execution flow

**Request**:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1
```

**With Configuration**:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{
    "conf": {
      "environment": "production",
      "batch_id": "123",
      "region": "us-west"
    }
  }'
```

**Response**:

```json
{
  "message": "DAG disaster_recovery_dag_1 run started successfully",
  "data": {
    "conf": { "environment": "production" },
    "dag_id": "disaster_recovery_dag_1",
    "dag_run_id": "manual__2025-11-17T07:50:38.278109+00:00",
    "state": "queued",
    "execution_date": "2025-11-17T07:50:38.278109+00:00"
  },
  "action": "run",
  "timestamp": "2025-11-17T07:50:38.289Z"
}
```

---

### Trigger DAG Run (Rerun)

**Endpoint**: `POST /api/disaster-recovery/trigger/:dag_id`

**Purpose**: Rerun a DAG with a specific logical date

**Use When**:

- 🔄 You need to backfill historical data
- 🔄 Reprocessing data for a specific time period
- 🔄 Setting a custom logical_date

**Request**:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/trigger/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{
    "conf": {},
    "logical_date": "2025-11-16T10:00:00Z"
  }'
```

**Response**:

```json
{
  "message": "DAG disaster_recovery_dag_1 triggered successfully",
  "data": {
    "dag_id": "disaster_recovery_dag_1",
    "dag_run_id": "manual__2025-11-17T07:37:07.610069+00:00",
    "logical_date": "2025-11-16T10:00:00+00:00",
    "state": "queued"
  },
  "action": "trigger",
  "timestamp": "2025-11-17T07:37:07.622Z"
}
```

---

## 🔧 Key Differences

| Feature           | `/run`           | `/trigger`               |
| ----------------- | ---------------- | ------------------------ |
| **Purpose**       | Start new run    | Rerun with specific date |
| **Logical Date**  | Not required     | Optional (for backfills) |
| **Use Case**      | Normal execution | Historical reprocessing  |
| **Configuration** | ✅ Supported     | ✅ Supported             |

---

## 📋 Complete API Endpoint List

### Health & Status

```bash
GET  /health                                    # API health check
GET  /api/disaster-recovery/status              # System dashboard
```

### DAG Management

```bash
GET  /api/dags                                  # Get all DAGs
GET  /api/dags/:dag_id                          # Get DAG details
POST /api/disaster-recovery/pause/:dag_id       # Pause a DAG
POST /api/disaster-recovery/unpause/:dag_id     # Resume a DAG
POST /api/disaster-recovery/run/:dag_id         # Run DAG now ⭐ NEW
POST /api/disaster-recovery/trigger/:dag_id     # Rerun DAG with date
```

### DAG Run Management

```bash
GET  /api/disaster-recovery/runs/:dag_id                      # Get DAG runs
GET  /api/disaster-recovery/runs/:dag_id/:dag_run_id          # Get run details
POST /api/disaster-recovery/clear/:dag_id/:dag_run_id         # Clear/rerun failed tasks
```

### Task Management

```bash
GET   /api/disaster-recovery/tasks/:dag_id/:dag_run_id                    # Get task instances
GET   /api/disaster-recovery/logs/:dag_id/:dag_run_id/:task_id            # Get task logs
PATCH /api/disaster-recovery/task-state/:dag_id/:dag_run_id/:task_id      # Update task state
```

### Bulk Operations

```bash
POST /api/disaster-recovery/pause-all           # Emergency: Pause all DAGs
POST /api/disaster-recovery/unpause-all         # Resume all DAGs
```

---

## 🎯 Common Scenarios

### Scenario 1: Run DAG Immediately

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1
```

### Scenario 2: Run with Custom Configuration

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{"conf": {"environment": "production", "region": "us-west"}}'
```

### Scenario 3: Backfill Yesterday's Data

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/trigger/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{"logical_date": "2025-11-16T00:00:00Z"}'
```

### Scenario 4: Emergency Stop

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/pause-all
```

### Scenario 5: View Running DAGs

```bash
curl http://localhost:3000/api/disaster-recovery/status
```

---

## 💡 Best Practices

1. **Use `/run` for normal operations** - Quick, simple execution
2. **Use `/trigger` for backfills** - When you need specific logical dates
3. **Always pass configuration** - Makes debugging easier
4. **Monitor with `/status`** - Check system health regularly
5. **Use `/pause-all` carefully** - Only in emergencies

---

## 🔗 Quick Links

- **Postman Collection**: `Disaster-Recovery-API.postman_collection.json`
- **Full Documentation**: `README.md`
- **Quick Reference**: `QUICKSTART.md`
- **Test Script**: `./test-api.sh`

---

**Updated**: 2025-11-17 with new `/run` endpoint
