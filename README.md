# Multi-Client Disaster Recovery API for Apache Airflow 2.11.0

This project provides a comprehensive multi-client disaster recovery API system for Apache Airflow, allowing you to manage multiple Airflow instances, handle failures, and perform recovery operations across different environments.

## Features

- ✅ **Multi-Client Support** - Manage multiple Airflow instances from a single API
- ✅ Pause/Resume DAGs across multiple clients
- ✅ Trigger DAG runs (Run immediately or Rerun with specific date)
- ✅ Clear and rerun failed tasks
- ✅ Get DAG and task status from multiple environments
- ✅ View task logs
- ✅ Bulk operations (pause/unpause all DAGs)
- ✅ Disaster recovery dashboard with multi-client aggregation
- ✅ Parallel API calls to multiple Airflow instances
- ✅ Per-client error handling (one failure doesn't affect others)
- ✅ Query parameter-based client selection

## Architecture

This setup includes:
- **Client1 (Production)**: Airflow on port 8080 with 2 DAGs (4 tasks each)
- **Client3 (Development)**: Airflow on port 8082 with 2 DAGs (4 tasks each)
- **Multi-Client API**: Node.js/Express server on port 3001

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Bash (for automated setup scripts)

## Quick Start

### One-Command Setup

```bash
# Install dependencies first (one time only)
npm install

# Start everything with a single command
./start.sh
```

This automated script will:
1. Create all necessary directories
2. Set proper permissions
3. Start Client1 (Production Airflow on port 8080)
4. Start Client3 (Development Airflow on port 8082)
5. Start the Multi-Client API server on port 3001
6. Wait for all services to be healthy
7. Display access URLs and usage examples

### Stop All Services

```bash
./stop.sh
```

### Manual Setup (Alternative)

If you prefer manual control:

```bash
# Install dependencies
npm install

# Start Client1 (Production)
docker compose -f docker-compose.yaml up -d

# Start Client3 (Development)
docker compose -f docker-compose-client3.yaml up -d

# Start Multi-Client API
PORT=3001 node src/index.js
```

### Access Services

- **Client1 (Production) Web UI**: http://localhost:8080
  - Username: `airflow`
  - Password: `airflow`
- **Client3 (Development) Web UI**: http://localhost:8082
  - Username: `airflow`
  - Password: `airflow`
- **Multi-Client Disaster Recovery API**: http://localhost:3001
  - Health Check: http://localhost:3001/health
  - List Clients: http://localhost:3001/api/clients

### First Time Setup

The first time you start, wait 2-3 minutes for Airflow instances to initialize the database and create the admin user.

## DAGs

### Client1 (Production) - Port 8080

Two production disaster recovery DAGs:

**1. disaster_recovery_dag_1**
- **Schedule**: Hourly (@hourly)
- **Tasks**: `start` → `process_data_batch_1` → `process_data_batch_2` → `end`
- **Task Duration**: Each task runs 5-10 seconds (random)
- **Tags**: disaster-recovery, hourly, critical

**2. disaster_recovery_dag_2**
- **Schedule**: Hourly (@hourly)
- **Tasks**: `start` → `create_backup` → `validate_backup` → `end`
- **Task Duration**: Each task runs 5-10 seconds (random)
- **Tags**: disaster-recovery, hourly, backup

### Client3 (Development) - Port 8082

Two development testing DAGs:

**1. dev_testing_pipeline_dag_1**
- **Schedule**: Hourly (@hourly)
- **Tasks**: `start` → `dev_testing_task` → `dev_integration_task` → `end`
- **Task Duration**: Each task runs 5-10 seconds (random)
- **Tags**: client3, development, testing

**2. dev_testing_pipeline_dag_2**
- **Schedule**: Hourly (@hourly)
- **Tasks**: `start` → `dev_build_task` → `dev_deploy_task` → `end`
- **Task Duration**: Each task runs 5-10 seconds (random)
- **Tags**: client3, development, deployment

## Multi-Client API Usage

### Query Parameter Format

All endpoints support the `?clients=client1,client3` query parameter to target specific Airflow instances:

```bash
# Query specific client
?clients=client1

# Query multiple clients
?clients=client1,client3

# No parameter = all enabled clients
(default behavior)
```

### Client Management

#### List All Configured Clients

```bash
GET /api/clients
```

```bash
curl http://localhost:3001/api/clients
```

## API Endpoints

### Health Check

```bash
GET /health
```

```bash
curl http://localhost:3001/health
```

### DAG Management

#### Get All DAGs (Multi-Client)

```bash
# From all enabled clients
GET /api/dags

# From specific client
GET /api/dags?clients=client1

# From multiple clients
GET /api/dags?clients=client1,client3
```

```bash
# Example: Get DAGs from both clients
curl "http://localhost:3001/api/dags?clients=client1,client3"
```

#### Get Specific DAG

```bash
GET /api/dags/:dag_id?clients=client1
```

#### Pause a DAG (Multi-Client)

```bash
POST /api/disaster-recovery/pause/:dag_id?clients=client1,client3
```

Example:

```bash
# Pause on both clients
curl -X POST "http://localhost:3001/api/disaster-recovery/pause/disaster_recovery_dag_1?clients=client1,client3"

# Pause on client1 only
curl -X POST "http://localhost:3001/api/disaster-recovery/pause/disaster_recovery_dag_1?clients=client1"
```

#### Unpause/Resume a DAG (Multi-Client)

```bash
POST /api/disaster-recovery/unpause/:dag_id?clients=client1,client3
```

Example:

```bash
curl -X POST "http://localhost:3001/api/disaster-recovery/unpause/disaster_recovery_dag_1?clients=client1,client3"
```

#### Run a DAG (Multi-Client)

```bash
POST /api/disaster-recovery/run/:dag_id?clients=client1,client3
Content-Type: application/json

{
  "conf": {}
}
```

Example:

```bash
# Run on both clients simultaneously
curl -X POST "http://localhost:3001/api/disaster-recovery/run/disaster_recovery_dag_1?clients=client1,client3" \
  -H "Content-Type: application/json" \
  -d '{"conf": {"environment": "production"}}'
```

**Note**: Use this endpoint to start a new DAG run immediately with optional configuration. The API will execute the run in parallel on all specified clients.

#### Trigger a DAG Run - Rerun (Multi-Client)

```bash
POST /api/disaster-recovery/trigger/:dag_id?clients=client1
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

## Testing the Multi-Client API

### 1. Check System Status (All Clients)

```bash
curl "http://localhost:3001/api/disaster-recovery/status"
```

### 2. List All Configured Clients

```bash
curl http://localhost:3001/api/clients
```

### 3. Get DAGs from Both Clients

```bash
curl "http://localhost:3001/api/dags?clients=client1,client3"
```

### 4. Run DAG on Both Clients Simultaneously

```bash
curl -X POST "http://localhost:3001/api/disaster-recovery/run/disaster_recovery_dag_1?clients=client1,client3" \
  -H "Content-Type: application/json" \
  -d '{"conf": {"test": "multi-client"}}'
```

### 5. Pause DAG on Specific Client

```bash
curl -X POST "http://localhost:3001/api/disaster-recovery/pause/disaster_recovery_dag_1?clients=client1"
```

### 6. Get DAG Runs from Client1

```bash
curl "http://localhost:3001/api/disaster-recovery/runs/disaster_recovery_dag_1?clients=client1"
```

### 7. Resume DAG on Both Clients

```bash
curl -X POST "http://localhost:3001/api/disaster-recovery/unpause/disaster_recovery_dag_1?clients=client1,client3"
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

## Automated Setup Scripts

### start.sh

One-command setup that:
- Creates all necessary directories
- Sets proper permissions  
- Starts both Airflow instances (Client1 and Client3)
- Starts the Multi-Client API server
- Waits for all services to be healthy
- Displays all access URLs and example commands

```bash
./start.sh
```

### stop.sh

Cleanly stops all services:
- Stops the Multi-Client API server
- Stops Client1 (Production Airflow)
- Stops Client3 (Development Airflow)

```bash
./stop.sh
```

## Environment Variables

- `PORT`: API server port (default: 3001 for multi-client setup)
- Multi-client configuration is stored in `config/clients.json`

## Directory Structure

```
.
├── start.sh                      # Automated startup script
├── stop.sh                       # Automated shutdown script
├── docker-compose.yaml           # Client1 (Production) - Port 8080
├── docker-compose-client3.yaml   # Client3 (Development) - Port 8082
├── package.json                  # Node.js dependencies
├── config/
│   └── clients.json              # Multi-client configuration
├── dags/                         # Client1 DAG files
│   ├── disaster_recovery_dag_1.py
│   └── disaster_recovery_dag_2.py
├── dags-client3/                 # Client3 DAG files
│   ├── dev_testing_pipeline_dag_1.py
│   └── dev_testing_pipeline_dag_2.py
├── logs/                         # Client1 logs (auto-created)
├── logs-client3/                 # Client3 logs (auto-created)
├── plugins/                      # Airflow plugins (shared)
└── src/
    ├── index.js                  # Multi-Client API server
    ├── services/
    │   └── airflowService.js     # Parallel API call service
    └── utils/
        └── clientManager.js      # Client configuration management
```

## Stopping the Services

### Using the stop script (Recommended)

```bash
./stop.sh
```

### Manual Shutdown

```bash
# Stop API server
pkill -f "PORT=3001 node"

# Stop Client1
docker compose down

# Stop Client3
docker compose -f docker-compose-client3.yaml down
```

To remove volumes as well:

```bash
docker compose down -v
docker compose -f docker-compose-client3.yaml down -v
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
