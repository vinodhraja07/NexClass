/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "rgb(var(--color-bg) / <alpha-value>)",
          secondary: "rgb(var(--color-bg-secondary) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated) / <alpha-value>)",
          muted: "rgb(var(--color-muted) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          accent: "rgb(var(--color-secondary-accent) / <alpha-value>)",
          ai: "rgb(var(--color-ai-accent) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
        },
        // Mapped to active theme CSS variables with full alpha support
        ink: {
          950: "rgb(var(--color-bg) / <alpha-value>)",
          900: "rgb(var(--color-bg) / <alpha-value>)",
          850: "rgb(var(--color-bg-secondary) / <alpha-value>)",
          800: "rgb(var(--color-surface) / <alpha-value>)",
          750: "rgb(var(--color-surface) / <alpha-value>)",
          700: "rgb(var(--color-border) / <alpha-value>)",
          600: "rgb(var(--color-border) / <alpha-value>)",
          500: "rgb(var(--color-muted) / <alpha-value>)",
        },
        ivory: {
          50: "rgb(var(--color-text-primary) / <alpha-value>)",
          100: "rgb(var(--color-text-primary) / <alpha-value>)",
          200: "rgb(var(--color-text-primary) / <alpha-value>)",
          300: "rgb(var(--color-text-secondary) / <alpha-value>)",
          400: "rgb(var(--color-text-secondary) / <alpha-value>)",
        },
        accent: {
          50: "rgb(var(--color-primary) / 0.15)",
          200: "rgb(var(--color-primary) / 0.75)",
          300: "rgb(var(--color-primary) / 0.90)",
          400: "rgb(var(--color-primary) / <alpha-value>)",
          500: "rgb(var(--color-primary) / <alpha-value>)",
          600: "rgb(var(--color-primary) / 0.85)",
          700: "rgb(var(--color-primary) / 0.70)",
        },
        lime: {
          300: "rgb(var(--color-secondary-accent) / 0.85)",
          400: "rgb(var(--color-secondary-accent) / <alpha-value>)",
          500: "rgb(var(--color-secondary-accent) / <alpha-value>)",
        },
        signal: {
          live: "var(--danger)",
          mic: "var(--primary)",
          muted: "var(--danger)",
          warn: "var(--warning)",
          info: "var(--secondary-accent)",
        },
      },
      fontFamily: {
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
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
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -30px rgba(0,0,0,0.85)",
        lift: "0 30px 80px -40px rgba(0,0,0,0.95)",
        glow: "0 0 0 1px rgba(46,224,168,0.25), 0 18px 50px -24px rgba(46,224,168,0.45)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(7,11,20,0) 0%, rgba(7,11,20,0.85) 78%, #070B14 100%)",
        "mesh-dark":
          "radial-gradient(1200px 600px at 12% -10%, rgba(46,224,168,0.16), transparent 60%), radial-gradient(900px 500px at 88% 0%, rgba(211,242,92,0.10), transparent 62%)",
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
