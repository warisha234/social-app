/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#E1306C',
          purple: '#833AB4',
          orange: '#F77737',
          yellow: '#FCAF45',
        },
        ink: '#0F0F10',
        paper: '#FAFAFA',
        canvas: '#0D0D12',
        ivory: '#FAF8F4',
        gold: '#C9A867',
        rose: '#E23E7A',
        violet: '#6C3FD1',
        app: 'rgb(var(--c-app) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        soft: 'rgb(var(--c-soft) / <alpha-value>)',
        body: 'rgb(var(--c-body) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        popover: '0 20px 40px -8px rgba(0,0,0,0.15)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(45deg, #F77737, #E1306C, #833AB4)',
        'story-ring': 'linear-gradient(45deg, #FCAF45, #F77737, #E1306C, #833AB4)',
      },
      borderRadius: {
        xl2: '1.25rem',
      }
    },
  },
  plugins: [],
}
