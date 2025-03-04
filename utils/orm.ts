import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

let client: Client | null = null;
let isConnected = false;

export const getClient = () => {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return client;
};

export const db = drizzle(getClient());

// check the connection to the database
export async function connectDB() {
  if (isConnected) {
    return; // Already connected
  }

  try {
    const dbClient = getClient();
    if (!isConnected) {
      await dbClient.connect();
      isConnected = true;
      console.log("Database connected successfully");
    }
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}
