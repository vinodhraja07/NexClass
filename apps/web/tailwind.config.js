/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05080F",
          900: "#070B14",
          850: "#0A101C",
          800: "#0E1524",
          750: "#121A2C",
          700: "#172136",
          600: "#1F2C45",
          500: "#2A3A57",
        },
        ivory: {
          50: "#FBF8F2",
          100: "#F4EFE6",
          200: "#E8E1D4",
          300: "#D6CCBA",
          400: "#A79C8B",
        },
        accent: {
          50: "#E6FBF3",
          200: "#9CF3D5",
          300: "#5FEAB9",
          400: "#2EE0A8",
          500: "#14C890",
          600: "#0AA275",
          700: "#087C5C",
        },
        lime: {
          300: "#E4F98A",
          400: "#D3F25C",
          500: "#B7DC32",
        },
        signal: {
          live: "#FF4D6D",
          mic: "#2EE0A8",
          muted: "#FF7A7A",
          warn: "#FFB547",
          info: "#6FA8FF",
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
