import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MeetingTransport, ProviderRuntimeStatus } from "@/lib/transport";

export type PeerStatus = "connecting" | "connected" | "failed" | "closed";

export interface PeerEntry {
  id: string;
  status: PeerStatus;
  stream: MediaStream | null;
  error?: string;
}

export interface PeerConnections {
  peers: Record<string, PeerEntry>;
  activeSpeakerId: string | null;
  /** True when a relay (TURN) server is actually usable from this client. */
  relayAvailable: boolean;
  iceServers: RTCIceServer[];
}

export interface InjectedIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

declare global {
  interface Window {
    /**
     * Relay parameters can only be used when the deployment injects them at
     * runtime. Credentials are never hardcoded in the client bundle.
     */
    __NEXCLASS_ICE_SERVERS__?: InjectedIceServer[];
  }
}

const SPEAKING_THRESHOLD = 0.035;

/**
 * Builds the ICE server list.
 *
 * STUN entries always come from the server (`providerStatus.stunServers`).
 * A TURN relay is only added when the server reports `turnConfigured` AND the
 * deployment injected usable relay credentials at runtime.
 *
 * Note on NAT reachability: STUN alone cannot traverse symmetric NAT or
 * restrictive corporate firewalls. A production deployment therefore needs a
 * TURN relay - and, for large classes, an SFU instead of a peer-to-peer mesh.
 */
export function buildIceServers(
  providerStatus: ProviderRuntimeStatus | null,
): { servers: RTCIceServer[]; relayAvailable: boolean } {
  const servers: RTCIceServer[] = [];
  (providerStatus?.stunServers ?? []).forEach((url) => {
    if (url) servers.push({ urls: url });
  });

  let relayAvailable = false;
  if (providerStatus?.turnConfigured) {
    const injected =
      typeof window === "undefined" ? undefined : window.__NEXCLASS_ICE_SERVERS__;
    if (injected && injected.length > 0) {
      servers.push(...injected);
      relayAvailable = true;
    }
  }

  return { servers, relayAvailable };
}

function describePeerStatus(state: RTCPeerConnectionState): PeerStatus {
  switch (state) {
    case "connected":
      return "connected";
    case "failed":
      return "failed";
    case "closed":
    case "disconnected":
      return "closed";
    default:
      return "connecting";
  }
}

export interface UsePeerConnectionsOptions {
  transport: MeetingTransport;
  selfId: string | null;
  localStream: MediaStream | null;
  remoteIds: string[];
  providerStatus: ProviderRuntimeStatus | null;
}

/**
 * A real WebRTC mesh.
 *
 * One RTCPeerConnection is kept per remote participant. To avoid offer glare
 * the participant with the lexicographically smaller id is the one that
 * creates the offer; the other side answers. If both sides offer at the same
 * time the impolite peer (smaller id) wins and the polite peer rolls back -
 * the classic "perfect negotiation" behaviour.
 */
export function usePeerConnections({
  transport,
  selfId,
  localStream,
  remoteIds,
  providerStatus,
}: UsePeerConnectionsOptions): PeerConnections {
  const [peers, setPeers] = useState<Record<string, PeerEntry>>({});
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  const pcsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const politeRef = useRef(new Map<string, boolean>());
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const relayRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const { servers, relayAvailable } = useMemo(
    () => buildIceServers(providerStatus),
    [providerStatus],
  );

  useEffect(() => {
    iceServersRef.current = servers;
    relayRef.current = relayAvailable;
  }, [relayAvailable, servers]);

  const updatePeer = useCallback((id: string, patch: Partial<PeerEntry>) => {
    setPeers((current) => {
      const existing = current[id];
      const merged: PeerEntry = { ...existing, ...patch };
      const next: PeerEntry = {
        id: merged.id ?? id,
        status: merged.status ?? "connecting",
        stream: merged.stream ?? null,
        error: merged.error,
      };
      return { ...current, [id]: next };
    });
  }, []);

  const attachLocalTracks = useCallback(async (pc: RTCPeerConnection, stream: MediaStream) => {
    const transceivers = pc.getTransceivers();
    for (const track of stream.getTracks()) {
      const free = transceivers.find(
        (transceiver) =>
          !transceiver.sender.track && transceiver.receiver.track?.kind === track.kind,
      );
      if (free) {
        // The remote offered to receive only (it has no camera) - keep the
        // direction honest instead of forcing a send.
        free.direction = free.currentDirection === "recvonly" ? "recvonly" : "sendrecv";
        try {
          await free.sender.replaceTrack(track);
        } catch {
          /* the track could not be attached - the peer still receives video */
        }
      } else {
        pc.addTrack(track, stream);
      }
    }
  }, []);

  const sendOffer = useCallback(
    async (id: string) => {
      const pc = pcsRef.current.get(id);
      if (!pc) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const description = pc.localDescription;
        if (!description) return;
        transport.emit("webrtc:offer", {
          toId: id,
          sdp: description.toJSON ? description.toJSON() : (description as RTCSessionDescriptionInit),
        });
      } catch {
        updatePeer(id, { status: "failed", error: "Could not create a connection offer." });
      }
    },
    [transport, updatePeer],
  );

  const ensurePeer = useCallback(
    (id: string) => {
      const existing = pcsRef.current.get(id);
      if (existing) return existing;
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      pcsRef.current.set(id, pc);
      politeRef.current.set(id, Boolean(selfId && selfId > id));

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        const remote = stream ?? new MediaStream([event.track]);
        updatePeer(id, { stream: remote });
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        transport.emit("webrtc:ice", {
          toId: id,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.onconnectionstatechange = () => {
        updatePeer(id, { status: describePeerStatus(pc.connectionState) });
        if (pc.connectionState === "failed") {
          updatePeer(id, { error: "The peer connection failed." });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          updatePeer(id, { status: "failed", error: "ICE negotiation failed." });
        }
      };

      return pc;
    },
    [selfId, transport, updatePeer],
  );

  const flushIce = useCallback(async (id: string, pc: RTCPeerConnection) => {
    const buffered = pendingIceRef.current.get(id);
    if (!buffered?.length) return;
    pendingIceRef.current.delete(id);
    for (const candidate of buffered) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* a rejected candidate is not fatal */
      }
    }
  }, []);

  /* ----------------------------- signalling ------------------------------ */

  useEffect(() => {
    if (transport.kind !== "live") return undefined;

    const offerOff = transport.on("webrtc:offer", (payload) => {
      const id = payload.fromId;
      const pc = ensurePeer(id);
      void (async () => {
        try {
          const collision = pc.signalingState !== "stable";
          const polite = politeRef.current.get(id) ?? true;
          if (collision) {
            if (!polite) {
              // The impolite peer keeps its own offer.
              return;
            }
            await pc.setLocalDescription({ type: "rollback" }).catch(() => undefined);
          }
          await pc.setRemoteDescription(payload.sdp);
          if (localStreamRef.current) {
            await attachLocalTracks(pc, localStreamRef.current);
          }
          await flushIce(id, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const description = pc.localDescription;
          if (!description) return;
          transport.emit("webrtc:answer", {
            toId: id,
            sdp: description.toJSON ? description.toJSON() : (description as RTCSessionDescriptionInit),
          });
          updatePeer(id, { status: "connecting" });
        } catch {
          updatePeer(id, { status: "failed", error: "Could not answer the connection offer." });
        }
      })();
    });

    const answerOff = transport.on("webrtc:answer", (payload) => {
      const id = payload.fromId;
      const pc = pcsRef.current.get(id);
      if (!pc) return;
      void (async () => {
        try {
          await pc.setRemoteDescription(payload.sdp);
          await flushIce(id, pc);
        } catch {
          updatePeer(id, { status: "failed", error: "Could not apply the connection answer." });
        }
      })();
    });

    const iceOff = transport.on("webrtc:ice", (payload) => {
      const id = payload.fromId;
      const pc = pcsRef.current.get(id);
      if (!pc || !pc.remoteDescription) {
        const buffered = pendingIceRef.current.get(id) ?? [];
        buffered.push(payload.candidate);
        pendingIceRef.current.set(id, buffered);
        return;
      }
      void pc.addIceCandidate(payload.candidate).catch(() => undefined);
    });

    return () => {
      offerOff();
      answerOff();
      iceOff();
    };
  }, [attachLocalTracks, ensurePeer, flushIce, transport, updatePeer]);

  /* --------------------------- peer lifecycle ---------------------------- */

  useEffect(() => {
    if (transport.kind !== "live" || !selfId) return;

    remoteIds.forEach((id) => {
      if (id === selfId) return;
      if (pcsRef.current.has(id)) return;
      if (selfId < id) {
        // The smaller id is the designated offerer.
        const pc = ensurePeer(id);
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
          });
        } else {
          pc.addTransceiver("audio", { direction: "recvonly" });
          pc.addTransceiver("video", { direction: "recvonly" });
        }
        updatePeer(id, { status: "connecting" });
        void sendOffer(id);
      } else {
        // The remote is the designated offerer - wait for its offer.
        updatePeer(id, { status: "connecting" });
      }
    });

    // Close connections to participants that left the room.
    const alive = new Set(remoteIds);
    Array.from(pcsRef.current.keys()).forEach((id) => {
      if (!alive.has(id)) {
        pcsRef.current.get(id)?.close();
        pcsRef.current.delete(id);
        pendingIceRef.current.delete(id);
        setPeers((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }
    });
  }, [ensurePeer, remoteIds, selfId, sendOffer, transport.kind, updatePeer]);

  /* ---------------------- local media arriving later ---------------------- */

  useEffect(() => {
    if (!localStream) return;
    pcsRef.current.forEach((pc, id) => {
      if (!selfId || !(selfId < id)) return;
      // The designated offerer re-offers so the new tracks are negotiated.
      localStream.getTracks().forEach((track) => {
        const free = pc
          .getTransceivers()
          .find(
            (transceiver) =>
              !transceiver.sender.track && transceiver.receiver.track?.kind === track.kind,
          );
        if (free) {
          void free.sender.replaceTrack(track).then(() => sendOffer(id));
        } else {
          pc.addTrack(track, localStream);
          void sendOffer(id);
        }
      });
    });
  }, [localStream, selfId, sendOffer]);

  /* ------------------------------ cleanup -------------------------------- */

  useEffect(
    () => () => {
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      pendingIceRef.current.clear();
    },
    [],
  );

  /* ---------------------------- active speaker ---------------------------- */

  const analysersRef = useRef(new Map<string, AnalyserNode>());
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef(new Map<string, Uint8Array>());

  useEffect(() => {
    const entries = Object.values(peers).filter((peer) => peer.stream);
    if (entries.length === 0) {
      setActiveSpeakerId(null);
      return undefined;
    }

    let ctx = ctxRef.current;
    if (!ctx) {
      const AudioContextCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return undefined;
      ctx = new AudioContextCtor();
      ctxRef.current = ctx;
    }

    const analysers = analysersRef.current;
    const seen = new Set<string>();
    entries.forEach((peer) => {
      const stream = peer.stream;
      if (!stream) return;
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;
      seen.add(peer.id);
      if (analysers.has(peer.id)) return;
      try {
        const source = ctx!.createMediaStreamSource(new MediaStream(audioTracks));
        const analyser = ctx!.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analysers.set(peer.id, analyser);
        buffersRef.current.set(peer.id, new Uint8Array(analyser.fftSize));
      } catch {
        /* the analyser is optional */
      }
    });

    Array.from(analysers.keys()).forEach((id) => {
      if (!seen.has(id)) {
        analysers.delete(id);
        buffersRef.current.delete(id);
      }
    });

    let frame = 0;
    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      if (ctx!.state !== "running") return;
      let bestId: string | null = null;
      let bestLevel = 0;
      analysers.forEach((analyser, id) => {
        const buffer = buffersRef.current.get(id);
        if (!buffer) return;
        analyser.getByteTimeDomainData(buffer as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const value = (buffer[index] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / buffer.length);
        if (rms > SPEAKING_THRESHOLD && rms > bestLevel) {
          bestId = id;
          bestLevel = rms;
        }
      });
      setActiveSpeakerId(bestId);
    };
    frame = window.requestAnimationFrame(tick);

    const resume = () => {
      void ctx!.resume().catch(() => undefined);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [peers]);

  return { peers, activeSpeakerId, relayAvailable, iceServers: servers };
}
