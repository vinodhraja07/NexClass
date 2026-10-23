import type { ReactNode } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * A labelled field with an explicit <label for> association, an optional hint
 * and an inline error that is announced through role="alert".
 */
export function FormField({ id, label, hint, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ivory-200">
          {label}
          {required ? <span className="ml-1 text-accent-400">*</span> : null}
        </label>
        {hint ? <span className="text-2xs text-ivory-400">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" id={`${id}-error`} className="text-2xs font-medium text-signal-live">
          {error}
        </p>
      ) : null}
    </div>
  );
}
