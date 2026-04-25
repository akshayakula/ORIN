/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          900: "#02030a",
          800: "#050717",
          700: "#0a0f24",
          600: "#101635",
        },
        cyan: {
          glow: "#94a3b8",
        },
        amber: {
          glow: "#d97706",
        },
        rose: {
          glow: "#dc2626",
        },
        steel: {
          50: "#f1f5f9",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          700: "#334155",
        },
        signal: {
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
        },
      },
      fontFamily: {
        display: [
          "ui-sans-serif",
          "system-ui",
          "Inter",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass:
          "0 10px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        glowCyan: "0 0 18px rgba(148, 163, 184, 0.25)",
        glowAmber: "0 0 18px rgba(217, 119, 6, 0.22)",
        glowRose: "0 0 18px rgba(220, 38, 38, 0.22)",
      },
      animation: {
        "spin-slow": "spin 30s linear infinite",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "scan-line": "scan-line 3s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.5)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scan-line": {
          "0%, 100%": { transform: "translateY(-100%)" },
          "50%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
