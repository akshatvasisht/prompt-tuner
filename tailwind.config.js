import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Zinc" Palette - No pure black
        background: "#18181b", // zinc-900
        foreground: "#f4f4f5", // zinc-100
        muted: {
          DEFAULT: "#27272a", // zinc-800
          foreground: "#a1a1aa", // zinc-400
        },
        border: "rgba(255, 255, 255, 0.08)", // 8% white opacity
        input: "rgba(255, 255, 255, 0.05)",
        primary: {
          DEFAULT: "#fafafa", // zinc-50
          foreground: "#18181b", // zinc-900
        },
        // Accent for "Active" states (e.g. cursor in cmdk)
        accent: {
          DEFAULT: "#27272a", // zinc-800
          foreground: "#fafafa",
        },
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      fontFamily: {
        sans: ["Inter", "Geist Sans", "sans-serif"],
      },
      letterSpacing: {
        tight: "-0.025em",
      },
      boxShadow: {
        glass: "0 8px 30px rgb(0 0 0 / 0.12)",
        "glass-sm": "0 2px 8px rgb(0 0 0 / 0.08)",
      },
      animation: {
        in: "enter 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        out: "exit 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        enter: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        exit: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
