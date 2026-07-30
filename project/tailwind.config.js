/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        farm: {
          bg: '#F8F7F2',
          surface: '#FFFFFF',
          primary: '#2E7D32',
          secondary: '#6B8E23',
          accent: '#D4A017',
          text: '#2B2B2B',
          border: '#E5E7EB',
          success: '#4CAF50',
          error: '#E53935',
          'dark-bg': '#121212',
          'dark-surface': '#1E1E1E',
          'dark-primary': '#4CAF50',
          'dark-secondary': '#8BC34A',
          'dark-accent': '#FFC107',
          'dark-text': '#F5F5F5',
          'dark-border': '#303030',
          'dark-success': '#66BB6A',
          'dark-error': '#EF5350',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};
