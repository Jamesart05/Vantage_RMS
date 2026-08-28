import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F4FAF7",
          100: "#E6F4EC",
          400: "#3EBB89",
          500: "#1E9E6B",
          600: "#147A52",
          700: "#0F4C3A",
          800: "#0B3D2C",
          900: "#06281E",
        },
        ink: {
          DEFAULT: "#0F1913",
          soft: "#3F4C46",
          muted: "#6B7A73",
        },
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        lg: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,25,19,0.06)",
        elevated: "0 8px 24px rgba(11,61,44,0.08)",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(24px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        slideIn: "slideIn .22s ease",
      },
    },
  },
  plugins: [],
};
export default config;
