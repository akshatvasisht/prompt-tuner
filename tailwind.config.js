import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "max-w-xl",
    "pt-status-error",
    "pt-status-warning",
    "pt-status-success",
    "pt-status-error-bg",
    "pt-status-warning-bg",
    "pt-status-success-bg",
    "pt-status-dot-error",
    "pt-status-dot-warning",
    "pt-status-dot-success",
    "font-sans",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      fontSize: {
        xs: ["11px", "16px"],
        sm: ["12px", "18px"],
        base: ["14px", "20px"],
        md: ["15px", "22px"],
        lg: ["18px", "26px"],
        xl: ["22px", "30px"],
      },
      borderRadius: {
        sm: "var(--pt-radius-sm)",
        DEFAULT: "var(--pt-radius)",
        md: "var(--pt-radius-md)",
        lg: "var(--pt-radius-lg)",
      },
      fontFamily: {
        sans: [
          '"Inter Variable"',
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        pt: "var(--pt-shadow)",
        "pt-lg": "var(--pt-shadow-lg)",
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
