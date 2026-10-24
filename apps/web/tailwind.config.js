/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "rgb(var(--color-bg, 16 26 22) / <alpha-value>)",
          secondary: "rgb(var(--color-bg-secondary, 23 35 29) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface, 29 48 40) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated, 41 64 52) / <alpha-value>)",
          floating: "rgb(var(--color-surface-floating, 32 56 46) / <alpha-value>)",
          muted: "rgb(var(--color-muted, 26 42 33) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary, 120 169 139) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover, 50 185 138) / <alpha-value>)",
          muted: "rgb(var(--color-primary-muted, 23 107 85) / <alpha-value>)",
          accent: "rgb(var(--color-secondary-accent, 196 184 135) / <alpha-value>)",
          ai: "rgb(var(--color-ai-accent, 155 155 120) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border, 52 72 59) / <alpha-value>)",
          subtle: "rgb(var(--color-border-subtle, 41 60 50) / <alpha-value>)",
          active: "rgb(var(--color-border-active, 120 169 139) / <alpha-value>)",
        },
        // Official Emerald Glass Darks
        ink: {
          950: "#0D1411",
          900: "#101A16", // Primary Background #101A16
          850: "#17231D", // Secondary Background #17231D
          800: "#1D3028", // Main Surface #1D3028
          750: "#20382E", // Floating Surface #20382E
          700: "#294034", // Elevated Surface #294034
          650: "#293C32", // Subtle Border #293C32
          600: "#34483B", // Default Border #34483B
          500: "#1A2A21", // Muted Surface #1A2A21
        },
        // Official Emerald Glass Typography
        ivory: {
          50: "#F4F7F3",
          100: "#E9EFE8", // Primary Text #E9EFE8
          200: "#D5DFD7",
          300: "#ACBCAF", // Secondary Text #ACBCAF
          400: "#829487", // Muted Text #829487
          inverse: "#101A16", // Inverse Text #101A16
        },
        // Official Emerald Glass Accents
        accent: {
          50: "#E9F6EF",
          100: "#D3EEDB",
          200: "#B3E5C5", // Pale Mint #B3E5C5
          300: "#32B98A", // Soft Emerald #32B98A
          400: "#78A98B", // Primary Emerald #78A98B
          500: "#5A8B6D",
          600: "#176B55", // Deep Emerald #176B55
          700: "#0F5241",
        },
        emerald: {
          primary: "#78A98B",
          deep: "#176B55",
          soft: "#32B98A",
          mint: "#B3E5C5",
        },
        sage: {
          300: "#D5CCA6",
          400: "#C4B887", // Secondary Sage #C4B887
          500: "#A89D6C",
        },
        lime: {
          300: "#B3E5C5",
          400: "#32B98A",
          500: "#176B55",
        },
        ai: {
          400: "#9B9B78", // AI Accent #9B9B78
        },
        signal: {
          live: "#32B98A",
          rec: "var(--danger)",
          mic: "#32B98A",
          muted: "#FF7A7A",
          warn: "#E5B869",
          info: "#78A98B",
        },
        neon: {
          emerald: "#32B98A",
          mint: "#B3E5C5",
          sage: "#C4B887",
        },
      },
      fontFamily: {
        display: [
          "Manrope",
          "Inter",
          "Sora",
          "Noto Sans Devanagari",
          "Noto Sans Tamil",
          "Noto Sans Bengali",
          "Noto Sans Oriya",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Inter",
          "Manrope",
          "Noto Sans Devanagari",
          "Noto Sans Tamil",
          "Noto Sans Bengali",
          "Noto Sans Oriya",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        indic: [
          "Noto Sans Devanagari",
          "Noto Sans Tamil",
          "Noto Sans Bengali",
          "Noto Sans Oriya",
          "Nirmala UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.035) inset, 0 20px 48px -16px rgba(0,0,0,0.45)",
        lift: "0 24px 60px -20px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(120,169,139,0.22), 0 16px 40px -20px rgba(120,169,139,0.35)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        "glass-hover": "0 16px 40px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 0 24px rgba(120, 169, 139, 0.15)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(16,26,22,0) 0%, rgba(16,26,22,0.85) 78%, #101A16 100%)",
        "mesh-dark":
          "radial-gradient(1200px 600px at 10% -10%, rgba(120,169,139,0.15), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(196,184,135,0.08), transparent 62%)",
        "card-gradient": "linear-gradient(180deg, #1D3028 0%, #17231D 100%)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.92)", opacity: "0.7" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "wave-bar": {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        "caption-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "emerald-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.2,0.8,0.2,1) infinite",
        "wave-bar": "wave-bar 900ms ease-in-out infinite",
        "caption-in": "caption-in 220ms cubic-bezier(0.2,0.8,0.2,1)",
        "shimmer": "emerald-shimmer 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
