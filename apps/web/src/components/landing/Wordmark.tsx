import clsx from "clsx";
import { triggerLogoTap } from "@/components/easter-eggs/HiddenEasterEggs";

/**
 * Original NexClass mark: three caption lines of decreasing weight, the first
 * one lit in the teal accent, with a lime cue dot at the end of the last line.
 * Tapping 5 times triggers the secret multilingual glyph fountain!
 */
export function NexClassMark({ className, onClick }: { className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <svg
      viewBox="0 0 28 28"
      role="img"
      aria-label="NexClass"
      onClick={(e) => {
        triggerLogoTap(e);
        onClick?.(e);
      }}
      className={clsx("h-8 w-8 shrink-0 cursor-pointer transition-transform active:scale-90 select-none", className)}
    >
      <rect
        x="0.75"
        y="0.75"
        width="26.5"
        height="26.5"
        rx="8.5"
        fill="#0E1524"
        stroke="rgba(244,239,230,0.16)"
        strokeWidth="1.5"
      />
      <path d="M7.5 9.5h8" stroke="#2EE0A8" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M7.5 14h12"
        stroke="rgba(244,239,230,0.6)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M7.5 18.5h5.5"
        stroke="rgba(244,239,230,0.32)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="18.5" r="2.1" fill="#D3F25C" />
    </svg>
  );
}

export function Wordmark({ className, onClick }: { className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <span
      onClick={(e) => {
        triggerLogoTap(e);
        onClick?.(e);
      }}
      className={clsx("flex items-center gap-2.5 cursor-pointer select-none group", className)}
      title="NexClass (Psst: Tap 5 times for a surprise!)"
    >
      <NexClassMark />
      <span className="font-display text-[17px] font-semibold tracking-[-0.03em] text-ivory-50 group-hover:text-accent-300 transition-colors">
        Nex<span className="text-ivory-300 group-hover:text-ivory-100">Class</span>
      </span>
    </span>
  );
}
