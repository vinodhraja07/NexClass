import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MonitorUp } from "lucide-react";
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
 * Google Meet-Style Adaptive Stage.
 *
 * Expands to full height and width, intelligently scaling video tiles
 * like Google Meet (1, 2, 3, 4, 6, 9 participants).
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
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const element = screenRef.current;
    if (!element) return;
    element.srcObject = screenStream;
    if (screenStream) void element.play().catch(() => undefined);
  }, [screenStream]);

  const count = participants.length;

  // Google Meet dynamic grid styles
  const gridLayout = (() => {
    if (count <= 1) return "grid-cols-1 max-w-4xl max-h-[82vh]";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-6xl max-h-[82vh]";
    if (count <= 4) return "grid-cols-2 max-w-6xl max-h-[85vh]";
    if (count <= 6) return "grid-cols-2 sm:grid-cols-3 max-w-7xl max-h-[88vh]";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl max-h-[90vh]";
  })();

  const renderTile = (participant: ParticipantPublic, isFilmstrip = false) => {
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
          isFilmstrip
            ? "aspect-video h-28 sm:h-36 shrink-0"
            : count <= 2
              ? "aspect-video max-h-[75vh]"
              : count <= 4
                ? "aspect-video max-h-[38vh]"
                : "aspect-video max-h-[28vh]"
        }
      />
    );
  };

  /* Screen Sharing View */
  if (screenStream) {
    return (
      <motion.div
        layout={!reduced}
        className={clsx("flex h-full w-full flex-col gap-2 p-2 sm:p-3 overflow-hidden", className)}
      >
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#0e0d17] border border-[#403B56]/60 shadow-2xl flex items-center justify-center">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted
            aria-label="Shared screen stream"
            className="h-full w-full object-contain"
          />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md border border-white/10">
            <MonitorUp className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            <span>Shared Screen</span>
          </div>
        </div>

        {/* Filmstrip below shared screen */}
        <div className="flex h-32 sm:h-40 shrink-0 gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {participants.map((participant) => renderTile(participant, true))}
        </div>
      </motion.div>
    );
  }

  /* Normal Google Meet Multi-tile View */
  return (
    <div
      className={clsx(
        "relative flex h-full w-full flex-1 items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden scrollbar-none",
        className,
      )}
    >
      {participants.length === 0 ? (
        <div className="flex aspect-video w-full max-w-lg items-center justify-center rounded-2xl border border-dashed border-[#403B56] bg-[#1B192A]/50 p-8 text-center text-white/50">
          <p className="text-sm">Waiting for participants to join the meeting…</p>
        </div>
      ) : (
        <motion.div
          layout={!reduced}
          className={clsx("grid h-full w-full items-center justify-center gap-3", gridLayout)}
        >
          {participants.map((participant) => renderTile(participant))}
        </motion.div>
      )}
    </div>
  );
}
