/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'touch': { 'raw': '(max-width: 1023px) and (orientation: landscape), (max-width: 1023px) and (max-height: 600px)' },
        'desktop': '1024px',
        'big': '1600px',
      },
    },
  },
  plugins: [],
}
