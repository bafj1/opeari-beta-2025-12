/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        opeari: {
          'bg': 'var(--opeari-bg)',
          'bg-secondary': 'var(--opeari-bg-secondary)',
          'bg-card': 'var(--opeari-bg-card)',
          'heading': 'var(--opeari-text-heading)',
          'text': 'var(--opeari-text-body)',
          'text-secondary': 'var(--opeari-text-secondary)',
          'green': 'var(--opeari-green)',
          'green-dark': 'var(--opeari-green-dark)',
          'mint': 'var(--opeari-mint)',
          'coral': 'var(--opeari-coral)',
          'coral-hover': 'var(--opeari-coral-hover)',
          'peach': 'var(--opeari-peach)',
          'border': 'var(--opeari-border)',
        },
        /* Legacy color mappings for backwards compatibility */
        'cream': 'var(--color-cream)',
        'primary': 'var(--color-primary)',
        'accent': 'var(--color-accent)',
        'mint': 'var(--color-mint)',
        'coral': 'var(--color-coral)',
        'peach': 'var(--color-peach)',
      },
      fontFamily: {
        sans: ['Comfortaa', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'button': '50px',
        'card': '20px',
        'input': '12px',
        'image': '16px',
        'modal': '20px',
        'tag': '50px',
      },
      boxShadow: {
        'card': '0 4px 16px var(--opeari-shadow)',
        'card-hover': '0 8px 24px var(--opeari-shadow-hover)',
        'button': '0 4px 12px rgba(30, 107, 78, 0.2)',
        'button-hover': '0 6px 16px rgba(30, 107, 78, 0.25)',
        'input-focus': '0 0 0 3px rgba(30, 107, 78, 0.1)',
      },
    },
  },
  plugins: [],
}