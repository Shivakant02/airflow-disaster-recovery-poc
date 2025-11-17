# Disaster Recovery API for Apache Airflow 2.11.0

This project provides a comprehensive disaster recovery API system for Apache Airflow, allowing you to manage DAGs, handle failures, and perform recovery operations.

## Features

- ✅ Pause/Resume DAGs
- ✅ Trigger DAG runs (Rerun)
- ✅ Clear and rerun failed tasks
- ✅ Get DAG and task status
- ✅ View task logs
- ✅ Bulk operations (pause/unpause all DAGs)
- ✅ Disaster recovery dashboard
- ✅ Two sample DAGs with 4 tasks each, scheduled hourly

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Airflow and Disaster Recovery API

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database
- Airflow Webserver (port 8080)
- Airflow Scheduler
- Disaster Recovery API (port 3000)

### 3. Access Services

- **Airflow Web UI**: http://localhost:8080
  - Username: `airflow`
  - Password: `airflow`
- **Disaster Recovery API**: http://localhost:3000
  - Health Check: http://localhost:3000/health

### 4. Wait for Initialization

The first time you start, wait 2-3 minutes for Airflow to initialize the database and create the admin user.

## DAGs

Two disaster recovery DAGs are included:

### 1. disaster_recovery_dag_1

- **Schedule**: Hourly (@hourly)
- **Tasks**:
  - `start` - Empty operator
  - `process_data_batch_1` - Python task
  - `process_data_batch_2` - Python task
  - `end` - Empty operator
- **Tags**: disaster-recovery, hourly, critical

### 2. disaster_recovery_dag_2

- **Schedule**: Hourly (@hourly)
- **Tasks**:
  - `start` - Empty operator
  - `create_backup` - Python task
  - `validate_backup` - Python task
  - `end` - Empty operator
- **Tags**: disaster-recovery, hourly, backup

## API Endpoints

### Health Check

```bash
GET /health
```

### DAG Management

#### Get All DAGs

```bash
GET /api/dags
```

#### Get Specific DAG

```bash
GET /api/dags/:dag_id
```

#### Pause a DAG

```bash
POST /api/disaster-recovery/pause/:dag_id
```

Example:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/pause/disaster_recovery_dag_1
```

#### Unpause/Resume a DAG

```bash
POST /api/disaster-recovery/unpause/:dag_id
```

Example:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/unpause/disaster_recovery_dag_1
```

#### Run a DAG

```bash
POST /api/disaster-recovery/run/:dag_id
Content-Type: application/json

{
  "conf": {}
}
```

Example:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{"conf": {"environment": "production"}}'
```

**Note**: Use this endpoint to start a new DAG run immediately with optional configuration.

#### Trigger a DAG Run (Rerun)

```bash
POST /api/disaster-recovery/trigger/:dag_id
Content-Type: application/json

{
  "conf": {},
  "logical_date": "2025-11-17T10:00:00Z"
}
```

Example:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/trigger/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{"conf": {"test": "value"}, "logical_date": "2025-11-17T10:00:00Z"}'
```

**Note**: Use this endpoint to rerun a DAG with a specific logical date for backfills or reprocessing.

### DAG Run Management

#### Get DAG Runs

```bash
GET /api/disaster-recovery/runs/:dag_id?limit=10&offset=0
```

#### Get Specific DAG Run

```bash
GET /api/disaster-recovery/runs/:dag_id/:dag_run_id
```

#### Clear/Rerun Failed Tasks

```bash
POST /api/disaster-recovery/clear/:dag_id/:dag_run_id
Content-Type: application/json

{
  "only_failed": true,
  "dry_run": false,
  "task_ids": ["task1", "task2"]
}
```

Example:

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/clear/disaster_recovery_dag_1/manual__2025-11-17T10:00:00+00:00 \
  -H "Content-Type: application/json" \
  -d '{"only_failed": true}'
```

### Task Management

#### Get Task Instances

```bash
GET /api/disaster-recovery/tasks/:dag_id/:dag_run_id
```

#### Get Task Logs

```bash
GET /api/disaster-recovery/logs/:dag_id/:dag_run_id/:task_id?try_number=1
```

#### Update Task State

```bash
PATCH /api/disaster-recovery/task-state/:dag_id/:dag_run_id/:task_id
Content-Type: application/json

{
  "new_state": "success",
  "dry_run": false
}
```

Valid states: `success`, `failed`, `skipped`

### Bulk Operations

#### Pause All DAGs

```bash
POST /api/disaster-recovery/pause-all
```

#### Unpause All DAGs

```bash
POST /api/disaster-recovery/unpause-all
```

### System Status

#### Get Disaster Recovery Dashboard Status

```bash
GET /api/disaster-recovery/status
```

Example response:

```json
{
  "total_dags": 2,
  "paused_dags": 0,
  "active_dags": 2,
  "dags": [
    {
      "dag_id": "disaster_recovery_dag_1",
      "is_paused": false,
      "is_active": true,
      "last_parsed_time": "2025-11-17T10:00:00Z",
      "tags": ["disaster-recovery", "hourly", "critical"]
    }
  ],
  "timestamp": "2025-11-17T10:00:00Z"
}
```

## Testing the API

### 1. Check System Status

```bash
curl http://localhost:3000/api/disaster-recovery/status
```

### 2. Pause a DAG

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/pause/disaster_recovery_dag_1
```

### 3. Trigger a DAG Run

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/trigger/disaster_recovery_dag_1 \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Get DAG Runs

```bash
curl http://localhost:3000/api/disaster-recovery/runs/disaster_recovery_dag_1
```

### 5. Resume a DAG

```bash
curl -X POST http://localhost:3000/api/disaster-recovery/unpause/disaster_recovery_dag_1
```

## Disaster Recovery Scenarios

### Scenario 1: DAG Failure Recovery

1. Identify failed DAG run: `GET /api/disaster-recovery/runs/:dag_id`
2. View failed tasks: `GET /api/disaster-recovery/tasks/:dag_id/:dag_run_id`
3. Clear and rerun failed tasks: `POST /api/disaster-recovery/clear/:dag_id/:dag_run_id`

### Scenario 2: System-wide Pause

1. Pause all DAGs: `POST /api/disaster-recovery/pause-all`
2. Perform maintenance
3. Resume all DAGs: `POST /api/disaster-recovery/unpause-all`

### Scenario 3: Manual Rerun

1. Trigger specific DAG: `POST /api/disaster-recovery/trigger/:dag_id`
2. Monitor run: `GET /api/disaster-recovery/runs/:dag_id/:dag_run_id`
3. Check task logs: `GET /api/disaster-recovery/logs/:dag_id/:dag_run_id/:task_id`

## Environment Variables

- `AIRFLOW_URL`: Airflow webserver URL (default: http://localhost:8080)
- `AIRFLOW_USERNAME`: Airflow admin username (default: airflow)
- `AIRFLOW_PASSWORD`: Airflow admin password (default: airflow)
- `PORT`: API server port (default: 3000)

## Directory Structure

```
.
├── docker-compose.yaml       # Docker Compose configuration
├── Dockerfile                # Node.js API Dockerfile
├── package.json              # Node.js dependencies
├── .env                      # Environment variables
├── dags/                     # Airflow DAG files
│   ├── disaster_recovery_dag_1.py
│   └── disaster_recovery_dag_2.py
├── logs/                     # Airflow logs (auto-created)
├── plugins/                  # Airflow plugins (auto-created)
└── src/
    └── index.js              # Disaster Recovery API server
```

## Stopping the Services

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
```

## Troubleshooting

### Airflow not accessible

- Wait 2-3 minutes for initialization
- Check logs: `docker-compose logs airflow-webserver`

### DAGs not showing

- Check DAG files are in `./dags` directory
- Check Airflow scheduler logs: `docker-compose logs airflow-scheduler`
- Verify DAG syntax: `docker-compose exec airflow-webserver airflow dags list`

### API connection issues

- Ensure Airflow webserver is running
- Check API logs: `docker-compose logs disaster-recovery-api`
- Verify credentials in `.env` file

## License

ISC
