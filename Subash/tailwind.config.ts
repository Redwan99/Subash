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
      colors: {
        // --- Light Mode Palette ---
        "light-bg": "#F8F5F0",         // warm off-white
        "light-surface": "#FFFFFF",
        "light-border": "rgba(0,0,0,0.08)",

        // --- Brand Accent (Violet) ---
        "accent": "#8B5CF6",
        "accent-light": "#A78BFA",
        "accent-dark": "#6D28D9",

        // --- Dark Mode Palette ---
        "dark-bg": "#0D1117",          // deep midnight
        "dark-surface": "#161B22",     // charcoal surface
        "dark-elevated": "#1C2333",    // elevated panels
        "dark-border": "rgba(255,255,255,0.08)",

        // --- Brand ---
        "brand": "#8B5CF6",            // violet is the brand colour
        "brand-hover": "#A78BFA",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backdropBlur: {
        xs: "2px",
        glass: "12px",
      },
      backgroundImage: {
        // Glass panel gradients
        "glass-light": "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 100%)",
        "glass-dark": "linear-gradient(135deg, rgba(28,35,51,0.65) 0%, rgba(22,27,34,0.45) 100%)",
        "accent-gradient": "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #6D28D9 100%)",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)",
        "glass-dark": "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "accent-glow": "0 0 20px rgba(139,92,246,0.35)",
      },
      animation: {
        "shimmer": "shimmer 2s linear infinite",
        "float-in": "floatIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      borderRadius: {
        "glass": "16px",
        "card": "12px",
      },
    },
  },
  plugins: [],
};

export default config;
