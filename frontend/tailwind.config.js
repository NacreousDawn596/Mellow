/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08070b',
        surface: '#111017',
        'surface-soft': '#17121d',
        'surface-hover': '#1b1624',
        'surface-press': '#241c31',
        ink: '#f4eef5',
        text: '#f4eef5',
        muted: '#aaa1ad',
        'muted-2': '#6f6a78',
        accent: '#c9b0e0',
        'accent-deep': '#8b5cf6',
        'accent-pink': '#d99bc7',
        lavender: '#c4b5fd',
        purple: '#8b5cf6',
        pink: '#e879f9',
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        display: ['Noto Serif Display', 'Times New Roman', 'Georgia', 'serif'],
        body: ['Noto Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['DejaVu Sans Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Noto Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 12px 32px rgba(0, 0, 0, 0.5)',
        lift: '0 28px 70px rgba(0, 0, 0, 0.62)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        spin: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        'fade-in': 'fade-in 0.28s ease-out both',
        'slide-up': 'slide-up 0.44s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
        spin: 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
