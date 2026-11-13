/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E3A5F',
          900: '#0F2440',
          950: '#091528',
        },
        cluster0: {
          DEFAULT: '#4A7FB5',
          light: '#6B9FD4',
          dark: '#3A6A9A',
          bg: '#EBF2FA',
          'bg-dark': '#1A2E44',
        },
        cluster1: {
          DEFAULT: '#D4A03C',
          light: '#E4B85C',
          dark: '#B8872E',
          bg: '#FDF6E8',
          'bg-dark': '#3D3118',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
