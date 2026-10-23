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
  { id: "participants", label: "Participants", icon: Users },
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
 * The tabbed classroom panel.
 *
 * On narrow screens it becomes a bottom sheet, and on wide screens it docks as
 * a fixed side column. The same four tabs serve both so the toolbar never has
 * to know about screen size.
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
    <div className="flex items-center gap-1 border-b border-ink-700/70 px-2 py-1.5">
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
              "nc-focus relative inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-2xs font-medium transition-colors",
              selected ? "text-ink-900" : "text-ivory-300 hover:text-ivory-50",
            )}
          >
            {selected ? (
              <motion.span
                layoutId="panel-tab-indicator"
                className="absolute inset-0 rounded-lg bg-accent-400"
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <Icon className="relative h-3.5 w-3.5" aria-hidden="true" />
            <span className="relative whitespace-nowrap">{tab.label}</span>
            {tab.id === "chat" && unreadChat > 0 ? (
              <span className="relative grid h-4 min-w-4 place-items-center rounded-full bg-signal-live px-1 font-mono text-[9px] font-bold text-white">
                {unreadChat}
              </span>
            ) : null}
          </button>
        );
      })}
      {compact ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close panel"
          className="nc-focus ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ivory-300 hover:text-ivory-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );

  const content = active === "participants" ? (
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
          <motion.aside
            key="sheet"
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 flex max-h-[76vh] flex-col rounded-t-2xl border border-b-0 border-ink-600 bg-ink-850 shadow-lift"
            aria-label="Classroom panels"
          >
            <span
              aria-hidden="true"
              className="mx-auto mt-1.5 block h-1 w-10 shrink-0 rounded-full bg-ink-500"
            />
            {header}
            <div className="min-h-[220px] flex-1 overflow-y-auto pb-[4.5rem]">{content}</div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    );
  }

  return (
    <aside
      aria-label="Classroom panels"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-850/95 shadow-panel"
    >
      {header}
      <motion.div
        key={active}
        initial={reduced ? { opacity: 1 } : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        {content}
      </motion.div>
    </aside>
  );
}
