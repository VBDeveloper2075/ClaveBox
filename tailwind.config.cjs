/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7f7ff',
          100: '#eaeaff',
          200: '#c8caff',
          300: '#a5aaff',
          400: '#7f86ff',
          500: '#5b62ff',
          600: '#474de6',
          700: '#3a3ec0',
          800: '#2f3399',
          900: '#242873'
        }
      }
    }
  },
  plugins: []
};
