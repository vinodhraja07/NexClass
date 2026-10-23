import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  size?: "sm" | "md";
  variant?: "secondary" | "ghost";
  className?: string;
}

async function writeToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

/** Copy-to-clipboard with a visible, announced confirmation state. */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  size = "sm",
  variant = "secondary",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function handleCopy() {
    const ok = await writeToClipboard(value);
    setCopied(ok);
    setFailed(!ok);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2000);
  }

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      aria-label={copied ? `${copiedLabel}` : `${label}: ${value}`}
      className={clsx(
        "nc-focus inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors duration-200",
        size === "sm" ? "h-9 px-3 text-[13px]" : "h-10 px-4 text-sm",
        variant === "secondary"
          ? "border border-ink-500/70 bg-ink-700/80 text-ivory-100 hover:bg-ink-600"
          : "text-ivory-300 hover:bg-ink-750 hover:text-ivory-50",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.16 }}
            className="inline-flex items-center gap-1.5 text-accent-300"
          >
            <Check className="h-3.5 w-3.5" />
            {copiedLabel}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.16 }}
            className="inline-flex items-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${copiedLabel}.` : failed ? "Copy failed. Select the value manually." : ""}
      </span>
    </motion.button>
  );
}
