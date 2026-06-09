/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Variable', 'sans-serif'],
      },
      colors: {
        // Neutral near-black scale for dark mode — replaces Tailwind's default
        // blue-tinted 800/900 so surfaces read as true black with subtle
        // elevation layers (body < sidebar < cards/modals < hover/inputs)
        // rather than dark blue-gray.
        gray: {
          800: '#1e1e1e',
          900: '#121212',
          925: '#0a0a0a',
          950: '#000000',
        },
        brown: {
          50:  '#fdf7f0',
          100: '#faebd7',
          200: '#f4d0aa',
          300: '#eaad73',
          400: '#de8c3e',
          500: '#c87020',
          600: '#b05c18',
          700: '#8f4815',
          800: '#733c16',
          900: '#5f3315',
          950: '#351909',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'glow': '0 0 20px rgba(200,112,32,0.15)',
      },
    },
  },
  safelist: [
    {
      pattern: /^(bg|text|border|ring)-brown-/,
      variants: ['hover', 'focus', 'dark', 'dark:hover', 'focus-within'],
    },
  ],
  plugins: [],
}
