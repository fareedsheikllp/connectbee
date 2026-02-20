module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0",
          300: "#86efac", 400: "#4ade80", 500: "#22c55e",
          600: "#16a34a", 700: "#15803d", 800: "#166534",
          900: "#14532d",
        },
        surface: {
          0: "#ffffff", 50: "#f8faf8", 100: "#f0f4f0",
          200: "#e4ebe4", 300: "#cddacd",
        },
        ink: {
          300: "#94a894", 400: "#6a826a", 500: "#4a5f4a",
          600: "#374737", 700: "#263326", 800: "#182318", 900: "#0d150d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sora)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.06)",
        medium: "0 4px 16px rgba(0,0,0,0.08)",
        large: "0 12px 40px rgba(0,0,0,0.1)",
        "brand-sm": "0 4px 16px rgba(34,197,94,0.2)",
        "brand-md": "0 8px 28px rgba(34,197,94,0.3)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
      },
    },
  },
  plugins: [],
};