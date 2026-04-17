/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0a0a0f',
          1: '#111118',
          2: '#1a1a24',
          3: '#22222f',
          4: '#2a2a3a',
        },
        brand: {
          DEFAULT: '#6c63ff',
          dark: '#5a52e0',
          light: '#8b84ff',
        },
      },
    },
  },
  plugins: [],
}

