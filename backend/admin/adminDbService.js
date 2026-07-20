import { getDbConfig, reconnectDatabase } from "../db.js";

/**
 * Reads details regarding dynamic database integration structures
 */
export function getCredentialsStatus() {
  return getDbConfig();
}

/**
 * Validates new TCP endpoints, overrides environment defaults, and boots tables
 */
export async function connectNewRegistryTarget(config) {
  if (!config.host || !config.database || !config.user) {
    throw new Error("Parameters missing: Host Address, Database Name, and User are required.");
  }
  return await reconnectDatabase(config);
}
