import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
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
 * Premium Classroom Real-Time Chat.
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
    <div className="flex h-full min-h-0 flex-col bg-surface/50">
      <div className="border-b border-border/60 bg-surface/80 px-4 py-3 backdrop-blur-md">
        <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Classroom Chat
        </p>
        <p className="mt-0.5 text-xs text-text-primary">
          Visible to all participants in this room
        </p>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center bg-background/30">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-surface border border-border/60 text-primary">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-2.5 text-xs font-semibold text-text-primary">No messages yet</p>
            <p className="mx-auto mt-1 max-w-[28ch] text-[11px] leading-relaxed text-text-secondary">
              Say hello or ask a question during the live lecture.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const mine = message.senderId === selfId;
              return (
                <motion.div
                  key={message.id}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  className={clsx("flex gap-2.5 items-end", mine ? "flex-row-reverse" : "flex-row")}
                >
                  {!mine && <Avatar name={message.senderName} size="xs" />}
                  <div className={clsx("max-w-[80%]", mine && "text-right")}>
                    <p className="text-[10px] text-text-secondary mb-1">
                      <span className="font-semibold text-text-primary">
                        {mine ? "You" : message.senderName}
                      </span>
                      <span className="ml-1.5 font-mono text-[9px] text-text-secondary/70">
                        {formatTime(message.createdAt)}
                      </span>
                    </p>
                    <div
                      className={clsx(
                        "inline-block rounded-2xl px-3.5 py-2 text-left text-xs leading-relaxed break-words shadow-xs border",
                        mine
                          ? "border-primary/40 bg-primary/20 text-text-primary rounded-br-xs"
                          : "border-border/70 bg-background/90 text-text-primary rounded-bl-xs",
                      )}
                    >
                      {message.message}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-border/70 bg-surface/80 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message the classroom
          </label>
          <input
            id="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Chat is disabled by host" : "Send a message to everyone…"}
            className="nc-focus h-9 flex-1 rounded-xl border border-border/70 bg-background px-3 text-xs text-text-primary placeholder:text-text-secondary/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !draft.trim()}
            aria-label="Send message"
            className="nc-focus grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-background transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40 shadow-xs"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {disabled && disabledReason && (
          <p className="mt-1 text-2xs text-text-secondary">{disabledReason}</p>
        )}
      </form>
    </div>
  );
}
