import { io, type Socket } from "socket.io-client";
import type {
  ClientEventMap,
  ConnectionStatus,
  MeetingTransport,
  ServerEventMap,
} from "./transport";
import { getAuthToken } from "./api";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? undefined;

export class SocketTransport implements MeetingTransport {
  readonly kind = "live" as const;

  private socket: Socket | null = null;
  private status: ConnectionStatus = "idle";
  private statusHandlers = new Set<(status: ConnectionStatus) => void>();

  constructor(
    private options: { meetingCode: string; name?: string; token?: string } = {
      meetingCode: "",
    },
  ) {}

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = this.options.token ?? getAuthToken();
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 800,
        reconnectionAttempts: Infinity,
      });

      this.socket.on("connect", () => {
        this.setStatus("connected");
        resolve();
      });
      this.socket.on("connect_error", (error: Error) => {
        this.setStatus("disconnected");
        reject(new Error(error.message || "Could not reach the meeting server."));
      });
      this.socket.io.on("reconnect_attempt", () => this.setStatus("reconnecting"));
      this.socket.on("disconnect", (reason: string) => {
        // The client itself closing is a deliberate leave; any other reason
        // means the socket will try to reconnect.
        this.setStatus(reason === "io client disconnect" ? "disconnected" : "reconnecting");
      });
    });
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.close();
    this.socket = null;
    this.setStatus("disconnected");
  }

  emit<E extends keyof ClientEventMap>(event: E, payload: ClientEventMap[E]) {
    this.socket?.emit(event as string, payload as unknown);
  }

  on<E extends keyof ServerEventMap>(
    event: E,
    handler: (payload: ServerEventMap[E]) => void,
  ): () => void {
    this.socket?.on(event as string, handler as (...args: unknown[]) => void);
    return () => {
      this.socket?.off(event as string, handler as (...args: unknown[]) => void);
    };
  }

  getStatus() {
    return this.status;
  }

  onStatusChange(handler: (status: ConnectionStatus) => void) {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }
}
