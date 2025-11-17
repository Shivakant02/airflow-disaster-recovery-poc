import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load clients configuration
const configPath = path.join(__dirname, "../../config/clients.json");
let clientsConfig = { airflow_clients: [] };

try {
  const configData = fs.readFileSync(configPath, "utf8");
  clientsConfig = JSON.parse(configData);
} catch (error) {
  console.error("Failed to load clients config:", error.message);
}

/**
 * Get all enabled clients
 */
export function getAllClients() {
  return clientsConfig.airflow_clients.filter((client) => client.enabled);
}

/**
 * Get client by ID
 */
export function getClientById(clientId) {
  return clientsConfig.airflow_clients.find(
    (client) => client.client_id === clientId && client.enabled
  );
}

/**
 * Get multiple clients by IDs
 */
export function getClientsByIds(clientIds) {
  if (!clientIds || clientIds.length === 0) {
    return getAllClients();
  }

  return clientIds
    .map((id) => getClientById(id))
    .filter((client) => client !== undefined);
}

/**
 * Parse client IDs from query parameter
 * Supports: ?clients=client1,client2,client3
 */
export function parseClientIds(clientsParam) {
  if (!clientsParam) {
    return [];
  }

  if (typeof clientsParam === "string") {
    return clientsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);
  }

  if (Array.isArray(clientsParam)) {
    return clientsParam;
  }

  return [];
}

/**
 * Create auth header for a client
 */
export function createAuthHeader(client) {
  const credentials = `${client.username}:${client.password}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}
