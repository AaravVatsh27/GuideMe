import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "var(--font-sans)", "system-ui", "sans-serif"],
        display: ["Syne", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--primary-foreground)",
        },
        guide: {
          ink: "#020617",
          navy: "#0f172a",
          slate: "#1e293b",
          mist: "#e2e8f0",
          teal: "#14b8a6",
          aqua: "#5eead4",
          amber: "#f59e0b",
          sand: "#f8fafc",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -12px, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(20, 184, 166, 0)",
            opacity: "0.9",
          },
          "50%": {
            boxShadow: "0 0 48px rgba(20, 184, 166, 0.35)",
            opacity: "1",
          },
        },
        "draw-line": {
          "0%": {
            strokeDasharray: "0 1",
            opacity: "0",
          },
          "100%": {
            strokeDasharray: "1 0",
            opacity: "1",
          },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "draw-line": "draw-line 1.2s ease-out forwards",
      },
      boxShadow: {
        card: "0 22px 55px -28px rgba(2, 6, 23, 0.55)",
        "card-hover": "0 30px 80px -34px rgba(15, 23, 42, 0.62)",
        glow: "0 18px 60px -28px rgba(20, 184, 166, 0.48)",
        surface:
          "0 1px 0 rgba(255, 255, 255, 0.05), 0 24px 48px -24px rgba(15, 23, 42, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
