import type { ReactNode } from "react";
import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";

/* --------------------------------- Motion -------------------------------- */

const EASE = [0.2, 0.8, 0.2, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

/**
 * Fades content in the first time it scrolls into view.
 * When the visitor asks for reduced motion we drop the transform entirely.
 */
export function Reveal({ children, delay = 0, y = 20, className, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-72px" }}
      transition={{
        duration: reduce ? 0.25 : 0.65,
        delay: reduce ? 0 : delay,
        ease: EASE,
      }}
    >
      {children}
    </Tag>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  gap?: number;
  as?: "div" | "ul" | "ol";
}

/**
 * Container that staggers the direct `StaggerItem` children.
 */
export function Stagger({ children, className, gap = 0.08, as = "div" }: StaggerProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-72px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduce ? 0 : gap } },
      }}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: reduce ? 0.25 : 0.55, ease: EASE },
        },
      }}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------- Layout --------------------------------- */

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10", className)}>
      {children}
    </div>
  );
}

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  label?: string;
}

/**
 * A landmark section with a stable anchor offset for the sticky header.
 */
export function Section({ id, children, className, label }: SectionProps) {
  return (
    <section
      id={id}
      aria-label={label}
      className={clsx("relative scroll-mt-20 border-t border-ink-700/60 py-20 sm:py-24 lg:py-32", className)}
    >
      {children}
    </section>
  );
}

/* ------------------------------- Headings -------------------------------- */

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={clsx("nc-eyebrow flex items-center gap-2.5", className)}>
      <span className="h-px w-6 bg-accent-400/70" aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={clsx(
        "text-balance text-[30px] leading-[1.08] font-semibold text-ivory-50 sm:text-[38px] lg:text-[46px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Lede({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "text-balance text-[15px] leading-relaxed text-ivory-300/90 sm:text-[17px] lg:text-[18px]",
        className,
      )}
    >
      {children}
    </p>
  );
}
