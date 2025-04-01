/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-in-out forwards',
        shimmer: 'shimmer 1.5s infinite',
        progressiveLoad: 'progressiveLoad 2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        progressiveLoad: {
          '0%': { width: '0%', opacity: 0.5 },
          '100%': { width: '100%', opacity: 1 }
        }
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'code': {
              backgroundColor: theme('colors.gray.100'),
              padding: '0.25rem',
              borderRadius: '0.25rem',
              fontWeight: 'normal',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: 0,
            },
            'blockquote': {
              fontStyle: 'normal',
              fontWeight: 'normal',
              color: theme('colors.gray.600'),
              borderLeftWidth: '4px',
              borderLeftColor: theme('colors.gray.300'),
            },
          }
        }
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 