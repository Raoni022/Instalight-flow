/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f2f9e8',
          100: '#dff0c1',
          200: '#c5e394',
          300: '#a8d464',
          400: '#8ec940',
          500: '#78B83A',
          600: '#64A030',
          700: '#4e7e26',
          800: '#3a5e1c',
          900: '#263f12',
        },
      },
    },
  },
  plugins: [],
};
