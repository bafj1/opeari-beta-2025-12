/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
          'border': 'var(--opeari-border)',
        },
        // Core Brand Colors
        'primary': '#1e6b4e',      // Evergreen - Primary Actions, Headlines
        'primary-dark': '#155a3e', // Hover state
        'primary-light': '#2d8a6b', // Gradients/Accents

        // Accents
        'coral': '#F8C3B3',      // Soft Coral - Secondary, Warmth
        'coral-hover': '#f5a08a', // Darker coral for hovers
        'mint': '#d8f5e5',       // Mint - Backgrounds, Success backgrounds
        'mint-dark': '#8bd7c7',  // Darker Mint - Borders, Decorative

        // Backgrounds
        'cream': '#fffaf5',      // Cream - Main Page Background
        'white': '#ffffff',      // Cards

        // Text
        'text-primary': '#1e6b4e', // Same as primary for consistency
        'text-secondary': '#3d8c6c', // Lighter green text
        'text-muted': '#4A6163',   // Slate - Body text, Muted
        'text-inverse': '#ffffff', // White text

        // Functional / Feedback
        'border': '#8bd7c7',     // Standard border color
        'error': '#e08e79',      // Terracotta - Softer/Earthier Error
        'error-bg': '#fff5f2',   // Very light pink/red for error backgrounds
        'error-border': '#f5c6b8',
        'success': '#1e6b4e',
      },
      fontFamily: {
        'comfortaa': ['Comfortaa', 'sans-serif'],
        'sans': ['Comfortaa', 'sans-serif'],
      },
      borderRadius: {
        'button': '50px',
        'card': '20px',
        'input': '12px',
        'image': '16px',
        'modal': '20px',
        'tag': '50px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 4px 16px var(--opeari-shadow)',
        'card-hover': '0 8px 24px var(--opeari-shadow-hover)',
        'button': '0 4px 12px rgba(30, 107, 78, 0.2)',
        'button-hover': '0 6px 16px rgba(30, 107, 78, 0.25)',
        'input-focus': '0 0 0 3px rgba(30, 107, 78, 0.1)',
        'input': '0 0 0 1px rgba(139, 215, 199, 0.3)',
      },
    },
  },
  plugins: [],
}