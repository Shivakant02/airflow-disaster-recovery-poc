import axios from "axios";
import { createAuthHeader } from "../utils/clientManager.js";

/**
 * Make API call to a specific Airflow client
 */
async function callAirflowClient(
  client,
  endpoint,
  method = "GET",
  data = null
) {
  try {
    const config = {
      method,
      url: `${client.airflow_url}/api/v1${endpoint}`,
      headers: {
        Authorization: createAuthHeader(client),
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds timeout
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      client_id: client.client_id,
      client_name: client.client_name,
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      client_id: client.client_id,
      client_name: client.client_name,
      success: false,
      error: error.response?.data?.detail || error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Make parallel API calls to multiple Airflow clients
 */
export async function callMultipleClients(
  clients,
  endpoint,
  method = "GET",
  data = null
) {
  const promises = clients.map((client) =>
    callAirflowClient(client, endpoint, method, data)
  );

  return await Promise.all(promises);
}

/**
 * Aggregate results from multiple clients
 */
export function aggregateResults(results) {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    total_clients: results.length,
    successful_clients: successful.length,
    failed_clients: failed.length,
    results: results,
  };
}
