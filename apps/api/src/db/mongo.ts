import mongoose from "mongoose";
import { env } from "../config/env";

let connected = false;
let usingFallback = false;

export async function connectMongo(): Promise<{ connected: boolean; fallback: boolean; detail: string }> {
  if (!env.mongoUri) {
    usingFallback = true;
    return {
      connected: false,
      fallback: true,
      detail: "MONGODB_URI is not set - using the in-memory document store.",
    };
  }
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri, {
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    connected = true;
    // eslint-disable-next-line no-console
    console.log(`[db] MongoDB connected (${env.mongoDbName})`);
    return { connected: true, fallback: false, detail: `MongoDB connected (${env.mongoDbName}).` };
  } catch (error) {
    usingFallback = true;
    const detail = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(`[db] MongoDB unavailable (${detail}) - falling back to the in-memory store.`);
    return { connected: false, fallback: true, detail: `MongoDB unavailable: ${detail}` };
  }
}

export function mongoStatus() {
  return {
    connected,
    fallback: usingFallback,
    uri: env.mongoUri ? env.mongoUri.replace(/\/\/[^@]*@/, "//***@") : null,
  };
}

export async function disconnectMongo() {
  if (connected) {
    await mongoose.disconnect();
    connected = false;
  }
}
