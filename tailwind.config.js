/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-dim': '#64748b',
        'accent-sky': '#38bdf8',
        'accent-amber': '#f59e0b',
        'accent-coral': '#fb7185',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
