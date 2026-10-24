import type { Transition, Variants } from "motion/react";

/**
 * ============================================================================
 * NEXCLASS OFFICIAL EMERALD GLASS MOTION SYSTEM
 * Apple-inspired subtle transitions, controlled springs & zero layout shifts
 * ============================================================================
 */

export const MOTION_TIMINGS = {
  buttonFeedback: 0.16,
  iconHover: 0.18,
  cardHover: 0.22,
  popover: 0.20,
  dialog: 0.26,
  pageTransition: 0.30,
  staggerDelay: 0.06,
  heroEntrance: 0.60,
} as const;

export const MOTION_EASINGS = {
  smoothEaseOut: [0.2, 0.8, 0.2, 1] as const,
  appleStandard: [0.32, 0.72, 0, 1] as const,
  quickOut: [0.16, 1, 0.3, 1] as const,
};

export const SPRINGS = {
  micro: { type: "spring", stiffness: 500, damping: 30 } as Transition,
  card: { type: "spring", stiffness: 400, damping: 28 } as Transition,
  smooth: { type: "spring", stiffness: 320, damping: 26 } as Transition,
  drawer: { type: "spring", stiffness: 380, damping: 34 } as Transition,
};

/* -------------------------------- Variants ------------------------------- */

/**
 * Page route transition: subtle fade + small vertical movement (280ms)
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMINGS.pageTransition,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
};

/**
 * Hero section entrance with staggered text lines
 */
export const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION_TIMINGS.staggerDelay,
      delayChildren: 0.08,
    },
  },
};

export const heroChildVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMINGS.heroEntrance,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
};

/**
 * Interactive card with subtle lift and specular border glow
 */
export const cardHoverMotion = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -2,
    scale: 1.008,
    transition: SPRINGS.card,
  },
  tap: {
    y: 0,
    scale: 0.99,
    transition: SPRINGS.micro,
  },
};

/**
 * Modal / Dialog entrance
 */
export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMINGS.dialog,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: {
      duration: 0.16,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
};

/**
 * Popover / Tooltip entrance
 */
export const popoverVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_TIMINGS.popover,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 2,
    transition: {
      duration: 0.14,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
};

/**
 * Multilingual live caption line entrance (smooth 8px slide, no distraction)
 */
export const captionItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: MOTION_EASINGS.smoothEaseOut,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
    },
  },
};
