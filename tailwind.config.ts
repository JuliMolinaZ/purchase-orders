import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0052CC',
          secondary: '#0747A6',
          accent: '#C80000',
          dark: '#091E42',
          light: '#F4F5F7',
        },
        run: {
          blue: '#0052CC',
          red: '#C80000',
          gray: {
            50: '#FAFBFC',
            100: '#F4F5F7',
            200: '#EBECF0',
            300: '#DFE1E6',
            400: '#C1C7D0',
            500: '#B3BAC5',
            600: '#8993A4',
            700: '#6B778C',
            800: '#505F79',
            900: '#344563',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Rubik', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'card-hover': '0 8px 20px rgba(0, 0, 0, 0.12)',
        'button': '0 2px 8px rgba(0, 82, 204, 0.2)',
        'button-hover': '0 6px 14px rgba(0, 82, 204, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
