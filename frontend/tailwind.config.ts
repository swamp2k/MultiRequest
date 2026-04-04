import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        council: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#bfd5ff',
          300: '#91b4fe',
          400: '#6090fc',
          500: '#3b6ef8',
          600: '#2550ee',
          700: '#1d3fda',
          800: '#1e34b0',
          900: '#1e318b',
          950: '#161f54',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
