import express from "express";
import axios from "axios";
import {
  getAllClients,
  getClientsByIds,
  parseClientIds,
} from "./utils/clientManager.js";
import {
  callMultipleClients,
  aggregateResults,
} from "./services/airflowService.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Legacy single-client configuration (fallback)
const AIRFLOW_URL = process.env.AIRFLOW_URL || "http://localhost:8080";
const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || "airflow";
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || "airflow";

// Create base64 encoded credentials for Basic Auth
const authHeader = `Basic ${Buffer.from(
  `${AIRFLOW_USERNAME}:${AIRFLOW_PASSWORD}`
).toString("base64")}`;

// Helper function to get clients from query params or use default
function getTargetClients(req) {
  const clientsParam = req.query.clients;

  if (clientsParam) {
    const clientIds = parseClientIds(clientsParam);
    return getClientsByIds(clientIds);
  }

  // Default: return all enabled clients
  return getAllClients().filter((client) => client.enabled);
}

// Helper function to make Airflow API calls (legacy single-client)
async function callAirflowAPI(endpoint, method = "GET", data = null) {
  try {
    const config = {
      method,
      url: `${AIRFLOW_URL}/api/v1${endpoint}`,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Airflow API Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  const clients = getAllClients();
  const enabledClients = clients.filter((c) => c.enabled);

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    multi_client_enabled: true,
    total_clients: clients.length,
    enabled_clients: enabledClients.length,
    clients: enabledClients.map((c) => ({
      client_id: c.client_id,
      client_name: c.client_name,
      airflow_url: c.airflow_url,
    })),
  });
});

// List all configured clients
app.get("/api/clients", (req, res) => {
  const clients = getAllClients();
  res.json({
    total_clients: clients.length,
    clients: clients.map((c) => ({
      client_id: c.client_id,
      client_name: c.client_name,
      airflow_url: c.airflow_url,
      enabled: c.enabled,
      description: c.description,
    })),
  });
});

// Get all DAGs (supports multi-client via ?clients=client1,client2)
app.get("/api/dags", async (req, res) => {
  const clients = getTargetClients(req);

  if (clients.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid clients specified or all clients disabled" });
  }

  const results = await callMultipleClients(clients, "/dags");
  const aggregated = aggregateResults(results);

  res.json(aggregated);
});

// Get specific DAG details
app.get("/api/dags/:dag_id", async (req, res) => {
  const { dag_id } = req.params;
  const result = await callAirflowAPI(`/dags/${dag_id}`);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.status || 500).json({ error: result.error });
  }
});

// Pause a DAG (supports multi-client via ?clients=client1,client2)
app.post("/api/disaster-recovery/pause/:dag_id", async (req, res) => {
  const { dag_id } = req.params;
  const clients = getTargetClients(req);

  if (clients.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid clients specified or all clients disabled" });
  }

  const results = await callMultipleClients(
    clients,
    `/dags/${dag_id}`,
    "PATCH",
    {
      is_paused: true,
    }
  );

  const aggregated = aggregateResults(results);

  res.json({
    message: `DAG ${dag_id} pause operation completed`,
    action: "pause",
    timestamp: new Date().toISOString(),
    ...aggregated,
  });
});

// Unpause/Resume a DAG (supports multi-client via ?clients=client1,client2)
app.post("/api/disaster-recovery/unpause/:dag_id", async (req, res) => {
  const { dag_id } = req.params;
  const clients = getTargetClients(req);

  if (clients.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid clients specified or all clients disabled" });
  }

  const results = await callMultipleClients(
    clients,
    `/dags/${dag_id}`,
    "PATCH",
    {
      is_paused: false,
    }
  );

  const aggregated = aggregateResults(results);

  res.json({
    message: `DAG ${dag_id} unpause operation completed`,
    action: "unpause",
    timestamp: new Date().toISOString(),
    ...aggregated,
  });
});

// Run a DAG (Create new DAG run) (supports multi-client via ?clients=client1,client2)
app.post("/api/disaster-recovery/run/:dag_id", async (req, res) => {
  const { dag_id } = req.params;
  const { conf } = req.body || {};
  const clients = getTargetClients(req);

  if (clients.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid clients specified or all clients disabled" });
  }

  const payload = {
    conf: conf || {},
  };

  const results = await callMultipleClients(
    clients,
    `/dags/${dag_id}/dagRuns`,
    "POST",
    payload
  );
  const aggregated = aggregateResults(results);

  res.json({
    message: `DAG ${dag_id} run operation completed`,
    action: "run",
    timestamp: new Date().toISOString(),
    ...aggregated,
  });
});

// Trigger a DAG run (Rerun with specific logical date) (supports multi-client via ?clients=client1,client2)
app.post("/api/disaster-recovery/trigger/:dag_id", async (req, res) => {
  const { dag_id } = req.params;
  const { conf, logical_date } = req.body || {};
  const clients = getTargetClients(req);

  if (clients.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid clients specified or all clients disabled" });
  }

  const payload = {
    conf: conf || {},
  };

  if (logical_date) {
    payload.logical_date = logical_date;
  }

  const results = await callMultipleClients(
    clients,
    `/dags/${dag_id}/dagRuns`,
    "POST",
    payload
  );
  const aggregated = aggregateResults(results);

  res.json({
    message: `DAG ${dag_id} trigger operation completed`,
    action: "trigger",
    timestamp: new Date().toISOString(),
    ...aggregated,
  });
});

// Get DAG runs
app.get("/api/disaster-recovery/runs/:dag_id", async (req, res) => {
  const { dag_id } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  const result = await callAirflowAPI(
    `/dags/${dag_id}/dagRuns?limit=${limit}&offset=${offset}`
  );

  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.status || 500).json({ error: result.error });
  }
});

// Get specific DAG run details
app.get("/api/disaster-recovery/runs/:dag_id/:dag_run_id", async (req, res) => {
  const { dag_id, dag_run_id } = req.params;
  const result = await callAirflowAPI(`/dags/${dag_id}/dagRuns/${dag_run_id}`);

  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.status || 500).json({ error: result.error });
  }
});

// Clear/Rerun failed tasks in a DAG run
app.post(
  "/api/disaster-recovery/clear/:dag_id/:dag_run_id",
  async (req, res) => {
    const { dag_id, dag_run_id } = req.params;
    const { dry_run = false, task_ids, only_failed = true } = req.body || {};

    const payload = {
      dry_run,
      only_failed,
    };

    if (task_ids && Array.isArray(task_ids)) {
      payload.task_ids = task_ids;
    }

    const result = await callAirflowAPI(
      `/dags/${dag_id}/dagRuns/${dag_run_id}/clear`,
      "POST",
      payload
    );

    if (result.success) {
      res.json({
        message: `Tasks cleared/rerun for DAG ${dag_id}, run ${dag_run_id}`,
        data: result.data,
        action: "clear",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(result.status || 500).json({ error: result.error });
    }
  }
);

// Get task instances for a DAG run
app.get(
  "/api/disaster-recovery/tasks/:dag_id/:dag_run_id",
  async (req, res) => {
    const { dag_id, dag_run_id } = req.params;
    const result = await callAirflowAPI(
      `/dags/${dag_id}/dagRuns/${dag_run_id}/taskInstances`
    );

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({ error: result.error });
    }
  }
);

// Get task instance logs
app.get(
  "/api/disaster-recovery/logs/:dag_id/:dag_run_id/:task_id",
  async (req, res) => {
    const { dag_id, dag_run_id, task_id } = req.params;
    const { try_number = 1 } = req.query;

    const result = await callAirflowAPI(
      `/dags/${dag_id}/dagRuns/${dag_run_id}/taskInstances/${task_id}/logs/${try_number}`
    );

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({ error: result.error });
    }
  }
);

app.get("/", (req, res) => {
  res.send("Welcome to the Disaster Recovery API for Airflow Instances!");
});

// Mark task instance state
app.patch(
  "/api/disaster-recovery/task-state/:dag_id/:dag_run_id/:task_id",
  async (req, res) => {
    const { dag_id, dag_run_id, task_id } = req.params;
    const { new_state, dry_run = false } = req.body || {};

    // Valid states: success, failed, skipped
    if (!["success", "failed", "skipped"].includes(new_state)) {
      return res
        .status(400)
        .json({ error: "Invalid state. Must be: success, failed, or skipped" });
    }

    const result = await callAirflowAPI(
      `/dags/${dag_id}/dagRuns/${dag_run_id}/taskInstances/${task_id}`,
      "PATCH",
      { new_state, dry_run }
    );

    if (result.success) {
      res.json({
        message: `Task ${task_id} state updated to ${new_state}`,
        data: result.data,
        action: "update_task_state",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(result.status || 500).json({ error: result.error });
    }
  }
);

// Disaster Recovery: Bulk pause all DAGs
app.post("/api/disaster-recovery/pause-all", async (req, res) => {
  const dagsResult = await callAirflowAPI("/dags");

  if (!dagsResult.success) {
    return res.status(500).json({ error: "Failed to fetch DAGs" });
  }

  const dags = dagsResult.data.dags || [];
  const results = [];

  for (const dag of dags) {
    const result = await callAirflowAPI(`/dags/${dag.dag_id}`, "PATCH", {
      is_paused: true,
    });
    results.push({
      dag_id: dag.dag_id,
      success: result.success,
      error: result.error,
    });
  }

  res.json({
    message: "Bulk pause operation completed",
    results,
    action: "pause_all",
    timestamp: new Date().toISOString(),
  });
});

// Disaster Recovery: Bulk unpause all DAGs
app.post("/api/disaster-recovery/unpause-all", async (req, res) => {
  const dagsResult = await callAirflowAPI("/dags");

  if (!dagsResult.success) {
    return res.status(500).json({ error: "Failed to fetch DAGs" });
  }

  const dags = dagsResult.data.dags || [];
  const results = [];

  for (const dag of dags) {
    const result = await callAirflowAPI(`/dags/${dag.dag_id}`, "PATCH", {
      is_paused: false,
    });
    results.push({
      dag_id: dag.dag_id,
      success: result.success,
      error: result.error,
    });
  }

  res.json({
    message: "Bulk unpause operation completed",
    results,
    action: "unpause_all",
    timestamp: new Date().toISOString(),
  });
});

// Disaster Recovery Dashboard - Get system status (supports multi-client via ?clients=client1,client2)
app.get("/api/disaster-recovery/status", async (req, res) => {
  const clients = getTargetClients(req);

  if (clients.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid clients specified or all clients disabled" });
  }

  const results = await callMultipleClients(clients, "/dags");

  const statusByClient = results.map((result) => {
    if (result.success) {
      const dags = result.data.dags || [];
      return {
        client_id: result.client_id,
        client_name: result.client_name,
        success: true,
        status: {
          total_dags: dags.length,
          paused_dags: dags.filter((d) => d.is_paused).length,
          active_dags: dags.filter((d) => !d.is_paused).length,
          dags: dags.map((d) => ({
            dag_id: d.dag_id,
            is_paused: d.is_paused,
            is_active: d.is_active,
            last_parsed_time: d.last_parsed_time,
            tags: d.tags,
          })),
        },
      };
    } else {
      return {
        client_id: result.client_id,
        client_name: result.client_name,
        success: false,
        error: result.error,
      };
    }
  });

  const aggregated = aggregateResults(results);

  res.json({
    timestamp: new Date().toISOString(),
    total_clients: aggregated.total_clients,
    successful_clients: aggregated.successful_clients,
    failed_clients: aggregated.failed_clients,
    clients: statusByClient,
  });
});

// Start the server
app.listen(PORT, () => {
  const clients = getAllClients();
  const enabledClients = clients.filter((c) => c.enabled);

  console.log(`🚀 Disaster Recovery API running on port ${PORT}`);
  console.log(`🌐 Multi-Client Mode: Enabled`);
  console.log(`📊 Total Clients: ${clients.length}`);
  console.log(`✅ Enabled Clients: ${enabledClients.length}`);
  enabledClients.forEach((client) => {
    console.log(
      `   - ${client.client_name} (${client.client_id}): ${client.airflow_url}`
    );
  });
  console.log(`📖 Health Check: http://localhost:${PORT}/health`);
  console.log(`📖 List Clients: http://localhost:${PORT}/api/clients`);
  console.log(
    `\n💡 Usage: Add ?clients=client1,client2 to any endpoint for multi-client operations`
  );
});
