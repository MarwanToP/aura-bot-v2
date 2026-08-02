/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          bg: '#060813',
          card: 'rgba(15, 20, 41, 0.6)',
          border: 'rgba(139, 92, 246, 0.2)',
          accent: '#8b5cf6',
          cyan: '#06b6d4',
          emerald: '#10b981',
        },
      },
      backgroundImage: {
        'cosmic-gradient': 'radial-gradient(ellipse at top, #1e1b4b 0%, #060813 70%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
    },
  },
  plugins: [],
};
