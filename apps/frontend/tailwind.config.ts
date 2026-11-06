import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        macro: {
          protein: "hsl(var(--macro-protein))",
          "protein-foreground": "hsl(var(--macro-protein-foreground))",
          carbs: "hsl(var(--macro-carbs))",
          "carbs-foreground": "hsl(var(--macro-carbs-foreground))",
          fat: "hsl(var(--macro-fat))",
          "fat-foreground": "hsl(var(--macro-fat-foreground))",
        },
        status: {
          ontrack: "hsl(var(--status-ontrack))",
          "ontrack-foreground": "hsl(var(--status-ontrack-foreground))",
          under: "hsl(var(--status-under))",
          "under-foreground": "hsl(var(--status-under-foreground))",
          over: "hsl(var(--status-over))",
          "over-foreground": "hsl(var(--status-over-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "serif"],
      },
      borderRadius: {
        "3xl": "calc(var(--radius) + 8px)",
        "2xl": "calc(var(--radius) + 4px)",
        xl: "var(--radius)",
        lg: "calc(var(--radius) - 2px)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
    },
  },
  plugins: [],
};

export default config;
