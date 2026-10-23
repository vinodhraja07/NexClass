import clsx from "clsx";

export interface CodeInputProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  describedBy?: string;
}

export function sanitiseCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

/**
 * Six character meeting code entry. Uppercases automatically, strips invalid
 * characters and accepts a pasted code.
 */
export function CodeInput({
  id,
  value,
  onChange,
  invalid = false,
  autoFocus = false,
  placeholder = "ABC123",
  describedBy,
}: CodeInputProps) {
  return (
    <input
      id={id}
      name="meetingCode"
      value={value}
      onChange={(event) => onChange(sanitiseCode(event.target.value))}
      onPaste={(event) => {
        const text = event.clipboardData.getData("text");
        if (!text) return;
        event.preventDefault();
        onChange(sanitiseCode(text));
      }}
      autoFocus={autoFocus}
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      maxLength={6}
      inputMode="text"
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={clsx(
        "nc-focus h-14 w-full rounded-xl border bg-ink-900/70 pl-5 pr-4 text-center font-mono text-[26px] font-semibold uppercase leading-none tracking-[0.38em] text-ivory-50 placeholder:text-ivory-400/40",
        "transition-colors duration-200",
        invalid ? "border-signal-live/70" : "border-ink-600 hover:border-ink-500",
      )}
    />
  );
}
