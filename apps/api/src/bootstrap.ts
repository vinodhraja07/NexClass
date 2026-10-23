import http from "node:http";
import type { Server } from "socket.io";
import { connectMongo, disconnectMongo } from "./db/mongo.js";
import { connectRedis, disconnectRedis } from "./db/redis.js";
import { env } from "./config/env.js";

export interface NexClassServer {
  httpServer: http.Server;
  io: Server;
  app: unknown;
  port: number;
}

/** Displays honest infrastructure status at startup. */
export async function bootstrap(options: { listen?: boolean; port?: number } = {}): Promise<NexClassServer> {
  const port = options.port ?? env.port;

  const mongo = await connectMongo();
  const redis = await connectRedis();

  // Models are imported after the connection attempt so they bind to MongoDB
  // when it is available and to the in-memory store otherwise.
  const { createApp } = await import("./app.js");
  const { attachRealtime } = await import("./realtime/socket.js");

  // Ensure default teacher and student demo accounts exist for testing and fast login
  try {
    const { UserModel } = await import("./models/index.js");
    const bcrypt = (await import("bcryptjs")).default;
    const existingTeacher = await UserModel.findOne({ email: "teacher@nexclass.com" });
    if (!existingTeacher) {
      const passwordHash = await bcrypt.hash("password123", 10);
      await UserModel.create({
        name: "Dr. Meera Krishnan",
        email: "teacher@nexclass.com",
        passwordHash,
        role: "teacher",
        preferredLanguage: "en",
      });
      await UserModel.create({
        name: "Arjun Sharma",
        email: "student@nexclass.com",
        passwordHash,
        role: "student",
        preferredLanguage: "hi",
      });
    }
  } catch {
    /* ignore seed error */
  }

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = attachRealtime(httpServer);

  const announce = (boundPort: number) =>
    console.log(
      `[nexclass] API listening on http://localhost:${boundPort} (${env.nodeEnv}) - mongo: ${
        mongo.connected ? "connected" : mongo.fallback ? "in-memory fallback" : "unknown"
      }, redis: ${redis.connected ? "connected" : redis.fallback ? "in-process fallback" : "unknown"}`,
    );

  if (options.listen === false) {
    return { httpServer, io, app, port: 0 };
  }

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", (error: NodeJS.ErrnoException) => {
      reject(new Error(`Could not bind the API on port ${port}: ${error.message}`));
    });
    httpServer.listen(port, () => {
      httpServer.removeAllListeners("error");
      announce(port);
      resolve();
    });
  });

  return { httpServer, io, app, port };
}

export async function shutdown(server?: NexClassServer) {
  if (server) {
    server.io.close();
    await new Promise<void>((resolve) => {
      server.httpServer.close(() => resolve());
    });
  }
  await Promise.allSettled([disconnectMongo(), disconnectRedis()]);
}
