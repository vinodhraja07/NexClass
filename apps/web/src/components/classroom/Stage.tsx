import { useEffect, useRef } from "react";
import { MonitorUp, Users } from "lucide-react";
import clsx from "clsx";
import type { ParticipantPublic } from "@nexclass/shared";
import { VideoTile, type TileStatus } from "./VideoTile";

export interface StageProps {
  participants: ParticipantPublic[];
  selfId: string | null;
  streams: Record<string, MediaStream | null>;
  statuses: Record<string, TileStatus>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  activeSpeakerId: string | null;
  /** Remote audio is muted while the translated voice mode is active. */
  audioMuted?: boolean;
  className?: string;
}

/**
 * The main stage.
 *
 * When somebody shares a screen their surface becomes the stage and the
 * participants collapse into a filmstrip.
 */
export function Stage({
  participants,
  selfId,
  streams,
  statuses,
  localStream,
  screenStream,
  activeSpeakerId,
  audioMuted = false,
  className,
}: StageProps) {
  const screenRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = screenRef.current;
    if (!element) return;
    element.srcObject = screenStream;
    if (screenStream) void element.play().catch(() => undefined);
  }, [screenStream]);

  const gridClass = (() => {
    const count = participants.length;
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-2 lg:grid-cols-3";
  })();

  const renderTile = (participant: ParticipantPublic, compact = false) => {
    const isSelf = participant.id === selfId;
    const stream = isSelf ? localStream : streams[participant.id] ?? null;
    const status: TileStatus = isSelf
      ? localStream
        ? "local"
        : "idle"
      : statuses[participant.id] ?? "idle";
    return (
      <VideoTile
        key={participant.id}
        participant={participant}
        stream={stream}
        status={status}
        isSelf={isSelf}
        activeSpeaker={activeSpeakerId === participant.id}
        audioMuted={audioMuted}
        className={
          compact
            ? "min-h-[110px]"
            : "aspect-video min-h-[132px]"
        }
      />
    );
  };

  if (screenStream) {
    return (
      <div className={clsx("space-y-3", className)}>
        <div className="relative overflow-hidden rounded-2xl border border-lime-400/30 bg-ink-950">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted
            aria-label="Shared screen"
            className="aspect-video w-full bg-ink-950 object-contain"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-lime-400/15 px-2.5 py-1 text-2xs font-semibold text-lime-300">
            <MonitorUp className="h-3 w-3" aria-hidden="true" />
            You are sharing your screen
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {participants.map((participant) => renderTile(participant, true))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("relative flex flex-col", className)}>
      {participants.length === 0 ? (
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-ink-600 bg-ink-850/60">
          <p className="text-sm text-ivory-400">Waiting for people to join…</p>
        </div>
      ) : (
        <>
          {/* The room size sits above the tiles so it can never overlap one. */}
          <div className="mb-2 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/85 px-2.5 py-1 text-2xs text-ivory-300">
              <Users className="h-3 w-3" aria-hidden="true" />
              {participants.length} in the room
            </span>
          </div>
          <div className={clsx("grid min-h-0 content-start gap-2.5", gridClass)}>
            {participants.map((participant) => renderTile(participant))}
          </div>
        </>
      )}
    </div>
  );
}
