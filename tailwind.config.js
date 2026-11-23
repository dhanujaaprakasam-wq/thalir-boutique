/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D5C3A',
          dark: '#073822',
          light: '#167C50',
          pale: '#EBF7F0'
        },
        gold: {
          DEFAULT: '#C5A059',
          light: '#FBF4E4',
          dark: '#AF8B43',
          shimmer: '#DFBA6D'
        },
        cream: {
          DEFAULT: '#FAF8F5',
          subtle: '#F4EFEA'
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#1EBE5D'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      boxShadow: {
        gold: '0 8px 25px rgba(197, 160, 89, 0.3)',
        card: '0 4px 20px rgba(13, 92, 58, 0.06)'
      }
    },
  },
  plugins: [],
}
