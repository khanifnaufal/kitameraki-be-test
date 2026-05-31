import { CosmosClient } from "@azure/cosmos";
import "dotenv/config";

const connectionString = process.env.COSMOS_CONNECTION_STRING;

if (!connectionString) {
    throw new Error("COSMOS_CONNECTION_STRING environment variable is not defined.");
}

export const cosmosClient = new CosmosClient(connectionString);

export const DATABASE_NAME = process.env.COSMOS_DATABASE_NAME ?? "TaskApp";
export const CONTAINER_NAME = process.env.COSMOS_CONTAINER_NAME ?? "Tasks";
