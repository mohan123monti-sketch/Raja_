/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          900: "#0b0c2a",
          800: "#131640",
          700: "#1d235e",
          600: "#2a3386",
          500: "#3d4cb8",
        },
        gold: {
          100: "#fef9e7",
          200: "#fcf0c2",
          300: "#fae290",
          400: "#f6ce52",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },
        ruby: {
          500: "#e11d48",
          600: "#be123c",
          700: "#9f1239",
        },
        emerald: {
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        serif: ["Cinzel", "Cinzel Decorative", "Georgia", "serif"],
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        royal: "0 10px 25px -5px rgba(234, 179, 8, 0.25), 0 8px 10px -6px rgba(234, 179, 8, 0.2)",
        chit: "0 12px 30px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(234, 179, 8, 0.15)",
      },
    },
  },
  plugins: [],
};
