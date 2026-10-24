/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "rgb(var(--color-bg, 8 9 12) / <alpha-value>)",
          secondary: "rgb(var(--color-bg-secondary, 13 14 20) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface, 18 20 28) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated, 30 34 48) / <alpha-value>)",
          muted: "rgb(var(--color-muted, 23 26 36) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary, 2 132 199) / <alpha-value>)",
          accent: "rgb(var(--color-secondary-accent, 255 42 122) / <alpha-value>)",
          ai: "rgb(var(--color-ai-accent, 56 189 248) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border, 40 45 64) / <alpha-value>)",
        },
        // Jet Black shades
        ink: {
          950: "#050507",
          900: "#08090C", // Jet Black Canvas Base
          850: "#0D0E14",
          800: "#12141C", // Panel/Surface Card
          750: "#171A24",
          700: "#1E2230", // Elevated Surface
          600: "#282D40", // Border
          500: "#383F57", // Muted
        },
        // Crisp Ivory / Off-White
        ivory: {
          50: "#FAFCFF",
          100: "#F1F5F9", // Typography Primary
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8", // Typography Secondary
        },
        // Cerulean Blue
        accent: {
          50: "#E0F2FE",
          200: "#7DD3FC",
          300: "#38BDF8",
          400: "#0284C7", // Cerulean Blue Primary Accent
          500: "#0077B6",
          600: "#0369A1",
          700: "#075985",
        },
        // Neon Rose
        rose: {
          300: "#FF659A",
          400: "#FF2A7A", // Neon Rose Accent
          500: "#FF1361",
          600: "#E0005E",
        },
        lime: {
          300: "#FF659A",
          400: "#FF2A7A", // Neon Rose
          500: "#FF1361",
        },
        signal: {
          live: "#FF1361", // Neon Rose Live Indicator
          rec: "#FF1361",
          mic: "#0284C7", // Cerulean Blue Mic
          muted: "#FF4D6D",
          warn: "#FFB547",
          info: "#0284C7",
        },
        neon: {
          cerulean: "#0284C7",
          rose: "#FF2A7A",
          cyan: "#38BDF8",
          mint: "#0284C7",
        },
      },
      fontFamily: {
        display: [
          "Sora",
          "Noto Sans Devanagari",
          "Noto Sans Tamil",
          "Noto Sans Bengali",
          "Noto Sans Oriya",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Inter",
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
        panel: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 24px 60px -30px rgba(0,0,0,0.92)",
        lift: "0 30px 80px -40px rgba(0,0,0,0.95)",
        glow: "0 0 0 1px rgba(2,132,199,0.35), 0 18px 50px -24px rgba(255,42,122,0.45)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(8,9,12,0) 0%, rgba(8,9,12,0.85) 78%, #08090C 100%)",
        "mesh-dark":
          "radial-gradient(1200px 600px at 12% -10%, rgba(2,132,199,0.22), transparent 60%), radial-gradient(900px 500px at 88% 0%, rgba(255,42,122,0.18), transparent 62%)",
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
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.8,0.2,1) infinite",
        "wave-bar": "wave-bar 900ms ease-in-out infinite",
        "caption-in": "caption-in 260ms cubic-bezier(0.2,0.8,0.2,1)",
      },
    },
  },
  plugins: [],
};
