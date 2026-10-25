/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0d0d0d',
          card: '#121214',
          border: '#27272a'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
