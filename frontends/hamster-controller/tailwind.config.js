/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../common/topology/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hamster: {
          orange: '#F59E0B',
          brown: '#92400E',
          beige: '#FEF3C7',
          ivory: '#FFFBEB',
        },
        dark: {
          bg: '#0f172a',        // 메인 배경 (slate-900)
          sidebar: '#1e293b',   // 사이드바 (slate-800)
          card: '#1e293b',      // 카드 배경 (slate-800)
          hover: '#334155',     // 호버 (slate-700)
          border: '#334155',    // 테두리 (slate-700)
        },
        accent: {
          orange: '#F59E0B',    // Hamster Orange 유지
          yellow: '#FCD34D',    // 밝은 강조
          blue: '#60A5FA',      // 정보 강조
        }
      },
      animation: {
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-fast': 'pulse-fast 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-fast': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }
    },
  },
  plugins: [],
}
