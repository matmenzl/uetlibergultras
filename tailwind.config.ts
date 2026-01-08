import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        sunrise: {
          start: "hsl(var(--sunrise-start))",
          mid: "hsl(var(--sunrise-mid))",
          end: "hsl(var(--sunrise-end))",
        },
        pass: {
          paper: "hsl(var(--pass-paper))",
          border: "hsl(var(--pass-border))",
        },
        stamp: {
          ink: "hsl(var(--stamp-ink))",
          faded: "hsl(var(--stamp-ink-faded))",
          milestone: "hsl(var(--stamp-milestone))",
          endurance: "hsl(var(--stamp-endurance))",
          special: "hsl(var(--stamp-special))",
          legend: "hsl(var(--stamp-legend))",
        },
      },
      backgroundImage: {
        'gradient-sunrise': 'var(--gradient-sunrise)',
        'gradient-hero': 'var(--gradient-hero)',
      },
      boxShadow: {
        'warm': 'var(--shadow-warm)',
        'glow': 'var(--shadow-glow)',
        'stamp-milestone': '0 0 20px hsl(var(--stamp-milestone) / 0.5), inset 0 0 15px hsl(var(--stamp-milestone) / 0.2)',
        'stamp-endurance': '0 0 20px hsl(var(--stamp-endurance) / 0.5), inset 0 0 15px hsl(var(--stamp-endurance) / 0.2)',
        'stamp-special': '0 0 20px hsl(var(--stamp-special) / 0.5), inset 0 0 15px hsl(var(--stamp-special) / 0.2)',
        'stamp-legend': '0 0 25px hsl(var(--stamp-legend) / 0.6), inset 0 0 20px hsl(var(--stamp-legend) / 0.3)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "stamp-press": {
          "0%": { 
            transform: "scale(2.5) rotate(-15deg)", 
            opacity: "0",
            filter: "blur(4px)"
          },
          "50%": { 
            transform: "scale(1.1) rotate(2deg)", 
            opacity: "1",
            filter: "blur(0px)"
          },
          "70%": { 
            transform: "scale(0.95) rotate(-1deg)", 
            opacity: "1" 
          },
          "85%": { 
            transform: "scale(1.02) rotate(0.5deg)", 
            opacity: "1" 
          },
          "100%": { 
            transform: "scale(1) rotate(0deg)", 
            opacity: "1" 
          },
        },
        "stamp-ink": {
          "0%": { opacity: "0" },
          "50%": { opacity: "0.8" },
          "100%": { opacity: "0.2" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 15px hsl(var(--stamp-legend) / 0.4)",
            filter: "brightness(1)"
          },
          "50%": { 
            boxShadow: "0 0 25px hsl(var(--stamp-legend) / 0.6)",
            filter: "brightness(1.1)"
          },
        },
        "wobble": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-2deg)" },
          "75%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "stamp-press": "stamp-press 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "stamp-ink": "stamp-ink 0.8s ease-out forwards",
        "shimmer": "shimmer 3s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "wobble": "wobble 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
