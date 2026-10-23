import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Captions, MessageSquare, Settings as SettingsIcon, Users, X } from "lucide-react";
import clsx from "clsx";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { ChatPanel } from "./ChatPanel";
import { CaptionsPanel } from "./CaptionsPanel";
import { SettingsPanel } from "./SettingsPanel";
import type { ParticipantsPanelProps } from "./ParticipantsPanel";
import type { ChatPanelProps } from "./ChatPanel";
import type { CaptionsPanelProps } from "./CaptionsPanel";
import type { SettingsPanelProps } from "./SettingsPanel";

export type SidePanelTab = "participants" | "chat" | "captions" | "settings";

const TABS: { id: SidePanelTab; label: string; icon: typeof Users }[] = [
  { id: "participants", label: "People", icon: Users },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "captions", label: "Captions", icon: Captions },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export interface PanelState {
  tab: SidePanelTab;
  chat: ChatPanelProps;
  participants: ParticipantsPanelProps;
  captions: CaptionsPanelProps;
  settings: SettingsPanelProps;
}

export interface ClassroomPanelProps {
  panel: PanelState;
  active: SidePanelTab;
  onActive: (tab: SidePanelTab) => void;
  onDismiss: () => void;
  unreadChat: number;
  /** Mobile renders the tab bar inside the sheet header. */
  compact?: boolean;
  /** Only honoured in compact mode: whether the bottom sheet is visible. */
  open?: boolean;
}

/**
 * Premium Apple/Linear-inspired Tabbed Classroom Sidebar & Drawer.
 */
export function PanelDock({
  panel,
  active,
  onActive,
  onDismiss,
  unreadChat,
  compact = false,
  open = true,
}: ClassroomPanelProps) {
  const reduced = useReducedMotion() ?? false;

  const header = (
    <div className="flex items-center gap-1 border-b border-border/70 bg-background/80 p-2 backdrop-blur-xl">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onActive(tab.id)}
            aria-pressed={selected}
            className={clsx(
              "nc-focus relative inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-2xs font-semibold transition-colors select-none",
              selected ? "text-background" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {selected && (
              <motion.span
                layoutId="panel-tab-indicator"
                className="absolute inset-0 rounded-xl bg-primary shadow-xs"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 450, damping: 36 }
                }
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
            <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
            {tab.id === "chat" && unreadChat > 0 && (
              <motion.span
                initial={reduced ? { scale: 1 } : { scale: 0.6 }}
                animate={{ scale: 1 }}
                className="relative z-10 grid h-4 min-w-4 place-items-center rounded-full bg-signal-live px-1 font-mono text-[9px] font-bold text-white shadow-xs"
              >
                {unreadChat}
              </motion.span>
            )}
          </button>
        );
      })}

      {compact && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close panel"
          className="nc-focus ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  const content =
    active === "participants" ? (
      <ParticipantsPanel {...panel.participants} />
    ) : active === "chat" ? (
      <ChatPanel {...panel.chat} />
    ) : active === "captions" ? (
      <CaptionsPanel {...panel.captions} />
    ) : (
      <SettingsPanel {...panel.settings} />
    );

  if (compact) {
    return (
      <AnimatePresence>
        {open ? (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onDismiss}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
              aria-hidden="true"
            />
            <motion.aside
              key="sheet"
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
              transition={{ duration: reduced ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[78vh] flex-col rounded-t-3xl border-t border-border bg-surface shadow-2xl"
              aria-label="Classroom panels"
            >
              <div className="flex justify-center pt-2 pb-1">
                <span
                  aria-hidden="true"
                  className="h-1 w-12 rounded-full bg-text-secondary/40"
                />
              </div>
              {header}
              <div className="min-h-[220px] flex-1 overflow-y-auto pb-16">{content}</div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    );
  }

  return (
    <aside
      aria-label="Classroom panels"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface/90 shadow-xl backdrop-blur-xl"
    >
      {header}
      <motion.div
        key={active}
        initial={reduced ? { opacity: 1 } : { opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        {content}
      </motion.div>
    </aside>
  );
}
