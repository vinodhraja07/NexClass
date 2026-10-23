import { default as request } from "supertest";

const { bootstrap, shutdown } = await import("../src/bootstrap.js");
const { registerMeetingHandlers } = await import("../src/realtime/socket.js");
const server = (await bootstrap({ port: 0 })) as unknown as {
  app: Parameters<typeof request>[0];
  httpServer: import("http").Server;
  io: import("socket.io").Server;
  port: number;
};
const app = server.app;

const reg = await request(app)
  .post("/api/auth/register")
  .send({ name: "Dbg Teacher", email: "dbg.t3@x.local", password: "Passw0rd!x", role: "teacher", preferredLanguage: "en" });
const token = reg.body.token;
const created = await request(app)
  .post("/api/meetings")
  .set("Authorization", `Bearer ${token}`)
  .send({ title: "Debug", speakerLanguage: "en" });
const code = created.body.meeting?.code;
console.log("code", code);

const shared = new Map<string, unknown>();
const handlers = new Map<string, Array<(...args: never[]) => void>>();
const socket = {
  data: {} as Record<string, unknown>,
  id: "sock-1",
  join: async () => undefined,
  leave: async () => undefined,
  emit: (event: string, payload?: unknown, ack?: (r: unknown) => void) => {
    console.log("emit", event, JSON.stringify(payload).slice(0, 80), "ack?", Boolean(ack));
  },
  to: () => ({ emit: (event: string, payload?: unknown) => console.log("emit-to", event, JSON.stringify(payload).slice(0, 80)) }),
  on: (event: string, handler: (...args: never[]) => void) => {
    handlers.set(event, [...(handlers.get(event) ?? []), handler]);
  },
  server: { sockets: { sockets: shared } },
};
shared.set("sock-1", socket);

try {
  registerMeetingHandlers(socket as never, {
    userId: "User_dbg_teacher",
    participantId: null,
    name: "Dbg",
    role: "teacher",
    meetingCode: null,
  } as never);
} catch (error) {
  console.log("register threw:", error);
}

const list = handlers.get("meeting:join") ?? [];
console.log("registered handlers:", [...handlers.keys()]);
if (list.length) {
  try {
    (list[0] as unknown as (...args: unknown[]) => unknown)({ meetingCode: code, name: "Dbg", language: "en" }, (res: unknown) =>
      console.log("ack", JSON.stringify(res)),
    );
  } catch (error) {
    console.log("handler threw:", error);
  }
}

setTimeout(async () => {
  await shutdown(server);
  process.exit(0);
}, 1500);