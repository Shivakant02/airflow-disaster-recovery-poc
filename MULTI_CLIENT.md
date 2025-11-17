# Multi-Client Airflow Support

## Overview

The Disaster Recovery API now supports managing multiple Airflow instances simultaneously. This feature allows you to:

- Query multiple Airflow environments (Production, Staging, Development) in parallel
- Perform disaster recovery operations across multiple instances at once
- Aggregate results from all clients in a single API response
- Selectively target specific clients using query parameters

## Configuration

All Airflow clients are configured in `config/clients.json`:

```json
{
  "airflow_clients": [
    {
      "client_id": "client1",
      "client_name": "Production Airflow",
      "airflow_url": "http://localhost:8080",
      "username": "airflow",
      "password": "airflow",
      "enabled": true,
      "description": "Production environment"
    },
    {
      "client_id": "client3",
      "client_name": "Development Airflow",
      "airflow_url": "http://localhost:8082",
      "username": "airflow",
      "password": "airflow",
      "enabled": true,
      "description": "Development environment"
    }
  ]
}
```

### Configuration Fields

- **client_id**: Unique identifier for the client (used in query parameters)
- **client_name**: Human-readable name
- **airflow_url**: Full URL to the Airflow web server
- **username**: Airflow username for Basic Auth
- **password**: Airflow password for Basic Auth
- **enabled**: Boolean flag to enable/disable the client
- **description**: Optional description of the environment

## Usage

### Default Behavior

If you don't specify a `clients` query parameter, the API will target **all enabled clients** by default:

```bash
# This will query all enabled clients
curl http://localhost:3000/api/dags
```

### Target Specific Clients

Use the `clients` query parameter to target specific clients:

```bash
# Query only Production
curl "http://localhost:3000/api/dags?clients=client1"

# Query Production and Development
curl "http://localhost:3000/api/dags?clients=client1,client3"
```

### Response Format

All multi-client responses include aggregated information:

```json
{
  "total_clients": 2,
  "successful_clients": 2,
  "failed_clients": 0,
  "results": [
    {
      "client_id": "client1",
      "client_name": "Production Airflow",
      "success": true,
      "data": {
        "dags": [...]
      }
    },
    {
      "client_id": "client3",
      "client_name": "Development Airflow",
      "success": true,
      "data": {
        "dags": [...]
      }
    }
  ]
}
```

If a client fails, the response includes error information:

```json
{
  "client_id": "client3",
  "client_name": "Development Airflow",
  "success": false,
  "error": "Connection refused",
  "status": 500
}
```

## Supported Endpoints

All disaster recovery endpoints support multi-client operations:

### Query Operations

- `GET /api/dags?clients=client1,client2` - List DAGs from multiple clients
- `GET /api/dags/:dag_id?clients=client1,client2` - Get DAG details
- `GET /api/disaster-recovery/status?clients=client1,client2` - System status
- `GET /api/disaster-recovery/runs/:dag_id?clients=client1,client2` - List DAG runs
- `GET /api/disaster-recovery/tasks/:dag_id/:dag_run_id?clients=client1,client2` - List tasks

### Action Operations

- `POST /api/disaster-recovery/pause/:dag_id?clients=client1,client2` - Pause DAG on multiple clients
- `POST /api/disaster-recovery/unpause/:dag_id?clients=client1,client2` - Unpause DAG
- `POST /api/disaster-recovery/run/:dag_id?clients=client1,client2` - Run DAG immediately
- `POST /api/disaster-recovery/trigger/:dag_id?clients=client1,client2` - Trigger DAG with date
- `POST /api/disaster-recovery/clear/:dag_id/:dag_run_id?clients=client1,client2` - Clear/rerun tasks

### Client Management

- `GET /api/clients` - List all configured clients

## Example Use Cases

### 1. Emergency Pause Across All Environments

```bash
# Pause a problematic DAG in all environments
curl -X POST "http://localhost:3000/api/disaster-recovery/pause/disaster_recovery_dag_1?clients=client1,client3"
```

### 2. Synchronized DAG Run

```bash
# Start the same DAG in Production and Development simultaneously
curl -X POST "http://localhost:3000/api/disaster-recovery/run/disaster_recovery_dag_1?clients=client1,client3" \
  -H "Content-Type: application/json" \
  -d '{"conf": {"param1": "value1"}}'
```

### 3. Cross-Environment Status Check

```bash
# Check DAG status across all environments
curl "http://localhost:3000/api/disaster-recovery/status?clients=client1,client3"
```

### 4. Production-Only Query

```bash
# Query only Production environment
curl "http://localhost:3000/api/dags?clients=client1"
```

## Error Handling

The API handles errors gracefully for each client:

1. **Connection Errors**: If a client's Airflow instance is unreachable, it returns an error for that client while still processing others
2. **Authentication Errors**: Invalid credentials are reported per-client
3. **Invalid Client IDs**: Non-existent client IDs are ignored
4. **Disabled Clients**: Disabled clients in the config are automatically skipped

## Performance

- **Parallel Execution**: All API calls to different clients are executed in parallel using `Promise.all()`
- **Timeout**: Each client request has a 30-second timeout to prevent hanging
- **Independent Failures**: One client's failure doesn't affect operations on other clients

## Adding New Clients

To add a new Airflow instance:

1. Edit `config/clients.json`
2. Add a new client object with unique `client_id`
3. Set `enabled: true`
4. Restart the API server

Example:

```json
{
  "client_id": "client2",
  "client_name": "Staging Airflow",
  "airflow_url": "http://staging-airflow:8080",
  "username": "airflow",
  "password": "airflow",
  "enabled": true,
  "description": "Staging testing environment"
}
```

## Architecture

### Components

1. **config/clients.json**: Client configuration storage
2. **src/utils/clientManager.js**: Client configuration management utilities
3. **src/services/airflowService.js**: Parallel API call service with error handling
4. **src/index.js**: Main API with multi-client endpoint support

### Flow

```
Client Request
    ↓
Parse ?clients query param
    ↓
Load client configs from clients.json
    ↓
Execute parallel API calls to all specified clients
    ↓
Aggregate results (success/failure per client)
    ↓
Return unified response
```

## Backward Compatibility

The API maintains backward compatibility:

- If no `clients` query parameter is provided, all enabled clients are used
- Legacy environment variables (`AIRFLOW_URL`, `AIRFLOW_USERNAME`, `AIRFLOW_PASSWORD`) are still supported but not used in multi-client mode

## Best Practices

1. **Use specific client IDs** for production operations to avoid unintended changes
2. **Test on staging first** before rolling out changes to production
3. **Monitor aggregated responses** for partial failures
4. **Keep client configurations secure** - use environment variables or secrets management for production
5. **Set reasonable timeouts** when calling multiple clients to prevent long waits
