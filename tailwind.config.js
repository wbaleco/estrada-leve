/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#8cf425",
        "primary-dark": "#76d618",
        "background-light": "#f7f8f5",
        "background-dark": "#192210",
        "card-dark": "#24301a",
        "surface-highlight": "#334522",
        "input-dark": "#364922",
        "text-muted": "#adcb90"
      },
      fontFamily: {
        "display": ["Lexend", "sans-serif"],
        "sans": ["Lexend", "sans-serif"]
      }
    },
  },
  plugins: [],
}
