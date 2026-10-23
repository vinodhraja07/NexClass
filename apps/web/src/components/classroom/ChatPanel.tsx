import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageSquare, Send } from "lucide-react";
import clsx from "clsx";
import type { ChatMessagePublic } from "@nexclass/shared";
import { Avatar } from "./Avatar";

export interface ChatPanelProps {
  messages: ChatMessagePublic[];
  selfId: string | null;
  onSend: (message: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Real time chat with the room.
 */
export function ChatPanel({
  messages,
  selfId,
  onSend,
  disabled = false,
  disabledReason,
}: ChatPanelProps) {
  const reduced = useReducedMotion() ?? false;
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages.length]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="nc-hairline px-4 py-3">
        <p className="nc-eyebrow">Class chat</p>
        <p className="mt-1 text-[13px] text-ivory-200">Messages are shared with the whole room.</p>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3.5"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-600 px-4 py-8 text-center">
            <MessageSquare className="mx-auto h-6 w-6 text-ink-500" aria-hidden="true" />
            <p className="mt-2 text-[13px] text-ivory-300">No messages yet.</p>
            <p className="mx-auto mt-1 max-w-[32ch] text-2xs leading-relaxed text-ivory-400">
              Ask a question and the teacher will see it right away.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const mine = message.senderId === selfId;
              return (
                <motion.div
                  key={message.id}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  className={clsx("flex gap-2.5", mine ? "flex-row-reverse" : "flex-row")}
                >
                  {!mine ? <Avatar name={message.senderName} size="xs" /> : null}
                  <div className={clsx("max-w-[78%]", mine && "text-right")}>
                    <p className="text-2xs text-ivory-400">
                      {mine ? "You" : message.senderName}
                      <span className="ml-1.5 font-mono text-ivory-500">
                        {formatTime(message.createdAt)}
                      </span>
                    </p>
                    <p
                      className={clsx(
                        "mt-1 inline-block max-w-full rounded-xl px-3 py-2 text-left text-[13px] leading-relaxed break-words",
                        mine
                          ? "bg-accent-400/15 text-ivory-50"
                          : "bg-ink-800/80 text-ivory-200",
                      )}
                    >
                      {message.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-ink-700/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message the classroom
          </label>
          <input
            id="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Chat is disabled" : "Message everyone"}
            className="nc-focus h-10 flex-1 rounded-xl border border-ink-600 bg-ink-900/80 px-3 text-[13px] text-ivory-50 placeholder:text-ivory-400/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !draft.trim()}
            aria-label="Send message"
            className="nc-focus grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-400 text-ink-900 transition-colors hover:bg-accent-300 disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {disabled && disabledReason ? (
          <p className="mt-1.5 text-2xs text-ivory-400">{disabledReason}</p>
        ) : null}
      </form>
    </div>
  );
}
