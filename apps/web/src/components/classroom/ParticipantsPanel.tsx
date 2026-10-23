import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Crown, Mic, MicOff, PhoneOff, Sparkles, Square, Video, VideoOff } from "lucide-react";
import clsx from "clsx";
import type { ParticipantPublic } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import { Avatar } from "./Avatar";

export interface ParticipantsPanelProps {
  participants: ParticipantPublic[];
  selfId: string | null;
  activeSpeakerId: string | null;
  isHost: boolean;
  onEndMeeting: () => void;
  ending: boolean;
}

/**
 * Premium Classroom Participants List.
 */
export function ParticipantsPanel({
  participants,
  selfId,
  activeSpeakerId,
  isHost,
  onEndMeeting,
  ending,
}: ParticipantsPanelProps) {
  const reduced = useReducedMotion() ?? false;

  const sorted = participants.slice().sort((a, b) => {
    if (a.role !== b.role) return a.role === "teacher" ? -1 : 1;
    if (a.id === selfId) return -1;
    if (b.id === selfId) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface/50">
      <div className="border-b border-border/60 bg-surface/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Classroom Roster
            </p>
            <p className="mt-0.5 text-xs text-text-primary font-semibold">
              {participants.length} {participants.length === 1 ? "person connected" : "people connected"}
            </p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            Multilingual
          </span>
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
          {sorted.map((participant) => {
            const active = activeSpeakerId === participant.id;
            const isSelf = participant.id === selfId;
            const isTeacher = participant.role === "teacher";

            return (
              <motion.li
                key={participant.id}
                layout={!reduced}
                initial={reduced ? { opacity: 1 } : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, x: 6 }}
                transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className={clsx(
                  "flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all duration-200 shadow-xs",
                  active
                    ? "border-primary/50 bg-primary/[0.08] shadow-sm ring-1 ring-primary/25"
                    : isSelf
                      ? "border-border/80 bg-surface/90"
                      : "border-border/50 bg-surface/50 hover:bg-surface/80 hover:border-border",
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar
                    name={participant.displayName}
                    size="sm"
                    active={active}
                    muted={!participant.audioEnabled}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate text-xs font-semibold text-text-primary">
                        {participant.displayName}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-medium text-text-secondary">
                          (you)
                        </span>
                      )}
                      {isTeacher && (
                        <span className="inline-flex items-center gap-0.5 rounded border border-secondary-accent/40 bg-secondary-accent/15 px-1 py-0.2 text-[9px] font-bold text-secondary-accent shrink-0">
                          <Crown className="h-2.5 w-2.5" />
                          <span>Host</span>
                        </span>
                      )}
                      {participant.isSimulated && (
                        <span className="rounded border border-ai-accent/30 bg-ai-accent/10 px-1 py-0.2 text-[9px] font-medium text-ai-accent shrink-0">
                          AI Demo
                        </span>
                      )}
                    </div>

                    {/* Language badges */}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span
                        title="UI Interface language"
                        className="rounded border border-border/70 bg-background/80 px-1.5 py-0.2 text-[10px] text-text-secondary"
                      >
                        UI: <span lang={participant.interfaceLanguage} className="font-medium text-text-primary">{languageNativeName(participant.interfaceLanguage)}</span>
                      </span>
                      <span
                        title="Caption subtitles language"
                        className="rounded border border-border/70 bg-background/80 px-1.5 py-0.2 text-[10px] text-text-secondary"
                      >
                        CC: <span lang={participant.captionLanguage} className="font-medium text-text-primary">{languageNativeName(participant.captionLanguage)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Media status indicators */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={clsx(
                      "grid h-6 w-6 place-items-center rounded-lg border transition-colors",
                      participant.audioEnabled
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-signal-live/40 bg-signal-live/15 text-signal-live",
                    )}
                    title={participant.audioEnabled ? "Microphone active" : "Microphone muted"}
                  >
                    {participant.audioEnabled ? (
                      <Mic className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <MicOff className="h-3 w-3" aria-hidden="true" />
                    )}
                  </span>

                  <span
                    className={clsx(
                      "grid h-6 w-6 place-items-center rounded-lg border transition-colors",
                      participant.videoEnabled
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border/60 bg-background/60 text-text-secondary",
                    )}
                    title={participant.videoEnabled ? "Camera on" : "Camera off"}
                  >
                    {participant.videoEnabled ? (
                      <Video className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <VideoOff className="h-3 w-3" aria-hidden="true" />
                    )}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {isHost && (
        <div className="border-t border-border/70 bg-surface/80 p-3.5 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
            Host Class Controls
          </p>
          <button
            type="button"
            onClick={onEndMeeting}
            disabled={ending}
            className="nc-focus inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-signal-live text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[0.99] disabled:opacity-50"
          >
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ending ? "Ending classroom session…" : "End Class For Everyone"}</span>
          </button>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-text-secondary">
            <PhoneOff className="h-3 w-3 text-signal-live shrink-0" aria-hidden="true" />
            <span>This disconnects all participants and saves the class transcript.</span>
          </p>
        </div>
      )}
    </div>
  );
}
