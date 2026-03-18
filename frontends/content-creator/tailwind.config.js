/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hamster: {
          orange: '#F59E0B',
          brown: '#92400E',
          beige: '#FEF3C7',
          ivory: '#FFFBEB',
        }
      },
      animation: {
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
