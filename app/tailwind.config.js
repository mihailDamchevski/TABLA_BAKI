/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'mid': '842px',
        'desktop': '1024px',
        'big': '1600px',
        'portrait-small': { 'raw': '(max-width: 841px) and (orientation: portrait)' },
      },
    },
  },
  plugins: [],
}
