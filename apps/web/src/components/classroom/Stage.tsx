import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
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
 * Premium Classroom Stage.
 *
 * Intelligently adapts grid geometry for 1, 2, 3, 4, 6, and larger classrooms
 * to avoid stretched or orphaned cards.
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

  const containerLayoutClass = (() => {
    if (count <= 1) return "max-w-3xl mx-auto w-full";
    if (count === 2) return "max-w-5xl mx-auto w-full";
    return "w-full";
  })();

  const gridClass = (() => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (count === 4) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
    return "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4";
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
            : count === 1
              ? "aspect-video min-h-[220px] max-h-[460px]"
              : count === 2
                ? "aspect-video min-h-[160px] max-h-[380px]"
                : "aspect-video min-h-[135px]"
        }
      />
    );
  };

  if (screenStream) {
    return (
      <motion.div
        layout={!reduced}
        className={clsx("flex flex-col space-y-3", className)}
      >
        <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-background shadow-lg">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted
            aria-label="Shared screen"
            className="aspect-video w-full bg-background object-contain max-h-[58vh]"
          />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/85 px-3 py-1 text-2xs font-semibold text-primary backdrop-blur-md shadow-sm">
            <MonitorUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Shared Screen View</span>
          </div>
        </div>

        {/* Filmstrip below screen */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
          {participants.map((participant) => (
            <div key={participant.id} className="w-44 shrink-0 sm:w-52">
              {renderTile(participant, true)}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={clsx("relative flex flex-col justify-center", className)}>
      {participants.length === 0 ? (
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface/40 p-6 text-center">
          <p className="text-sm text-text-secondary">Waiting for participants to join the classroom…</p>
        </div>
      ) : (
        <div className={containerLayoutClass}>
          {/* Header pill indicator */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-secondary">
              Classroom View
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/80 px-2.5 py-0.5 text-2xs text-text-secondary backdrop-blur-sm shadow-xs">
              <Users className="h-3 w-3 text-primary" aria-hidden="true" />
              <span>
                {participants.length} {participants.length === 1 ? "participant" : "participants"}
              </span>
            </span>
          </div>

          <motion.div
            layout={!reduced}
            className={clsx("grid min-h-0 content-start gap-3", gridClass)}
          >
            {participants.map((participant) => renderTile(participant))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
