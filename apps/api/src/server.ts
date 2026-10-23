import { bootstrap, shutdown } from "./bootstrap.js";

const server = await bootstrap();
const exit = async (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`[nexclass] ${signal} received, shutting down.`);
  await shutdown(server);
  process.exit(0);
};
process.on("SIGINT", () => void exit("SIGINT"));
process.on("SIGTERM", () => void exit("SIGTERM"));
