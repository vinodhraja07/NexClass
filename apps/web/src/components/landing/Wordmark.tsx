import clsx from "clsx";

/**
 * Original NexClass mark: three caption lines of decreasing weight, the first
 * one lit in the teal accent, with a lime cue dot at the end of the last line.
 */
export function NexClassMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      role="img"
      aria-label="NexClass"
      className={clsx("h-8 w-8 shrink-0", className)}
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

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <NexClassMark />
      <span className="font-display text-[17px] font-semibold tracking-[-0.03em] text-ivory-50">
        Nex<span className="text-ivory-300">Class</span>
      </span>
    </span>
  );
}
