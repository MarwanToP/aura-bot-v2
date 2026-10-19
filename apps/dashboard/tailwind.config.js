/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // UI & data — Inter (dense tables, controls, body copy of panels)
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Descriptions / marketing copy — Poppins
        body: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
        // Headings, brand lockup, KPI numerals — Poppins (tight tracking)
        display: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Canvas + aurora (glass theme v2)
        canvas: {
          DEFAULT: '#05070D', // page base — near-black navy
          soft: '#080B14', // raised canvas
          blue: '#1B3A6B', // aurora blob — deep blue
          indigo: '#2A1B5E', // aurora blob — indigo
          teal: '#0E3A4A', // aurora blob — teal
        },
        // Frosted glass fills / hairlines
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          soft: 'rgba(255, 255, 255, 0.025)',
          strong: 'rgba(255, 255, 255, 0.07)',
          line: 'rgba(255, 255, 255, 0.08)',
          lineStrong: 'rgba(255, 255, 255, 0.14)',
        },
        // Accents (glow + icon tiles + charts)
        accent: {
          blue: '#4C7DFF', // primary gradient start
          violet: '#7C5CFF', // primary gradient end
          cyan: '#22D3EE',
          teal: '#2DD4BF',
          pink: '#F472B6',
          green: '#34D399', // growth
          amber: '#FBBF24',
          red: '#F87171', // danger
        },
        // Ink scale (text)
        ink: {
          DEFAULT: '#F8FAFC',
          muted: '#94A3B8',
          faint: '#64748B',
        },
        aura: {
          bg: '#05070D',
          surface: '#0A0F1A',
          surfaceElevated: '#0E1424',
          surfaceHigh: '#121A2C',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(76, 125, 255, 0.35)',
          primary: '#7C5CFF',
          violet: '#7C5CFF',
          secondary: '#4C7DFF',
          blue: '#4C7DFF',
          teal: '#2DD4BF',
          mint: '#34D399',
          success: '#34D399',
          amber: '#FBBF24',
          warning: '#FBBF24',
          coral: '#F87171',
          danger: '#F87171',
          textMain: '#F8FAFC',
          textMuted: '#94A3B8',
          textDim: '#64748B',
        },
        cosmic: {
          bg: '#05070D',
          card: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#7C5CFF',
          cyan: '#22D3EE',
          emerald: '#34D399',
        },
        deepBlack: '#05070D',
      },
      backgroundImage: {
        // Aurora canvas washes
        'aura-gradient': 'radial-gradient(ellipse at 20% 0%, rgba(42, 27, 94, 0.55) 0%, rgba(5, 7, 13, 0) 60%), radial-gradient(ellipse at 85% 15%, rgba(27, 58, 107, 0.45) 0%, rgba(5, 7, 13, 0) 55%)',
        // Glass sheen used on every surface
        'glass-gradient': 'linear-gradient(150deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 55%, rgba(255, 255, 255, 0.035) 100%)',
        'glass-sheen': 'linear-gradient(180deg, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'rail-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 42%, rgba(255, 255, 255, 0.04) 100%)',
        // Primary CTA / active nav pill
        'accent-gradient': 'linear-gradient(135deg, #4C7DFF 0%, #7C5CFF 100%)',
        'accent-gradient-soft': 'linear-gradient(135deg, rgba(76, 125, 255, 0.9) 0%, rgba(124, 92, 255, 0.85) 100%)',
        // Accent text gradient (headings highlights)
        'text-gradient': 'linear-gradient(120deg, #8FB4FF 0%, #C4B5FD 50%, #67E8F9 100%)',
      },
      boxShadow: {
        glass: '0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-sm': '0 14px 36px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-lg': '0 40px 120px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        modal: '0 40px 110px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        glow: '0 10px 30px rgba(76, 125, 255, 0.35)',
        'glow-sm': '0 6px 20px rgba(76, 125, 255, 0.25)',
        'glow-violet': '0 10px 30px rgba(124, 92, 255, 0.35)',
        'glow-green': '0 10px 30px rgba(52, 211, 153, 0.25)',
      },
      borderRadius: {
        '4xl': '26px',
        '5xl': '30px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        auroraDrift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(2%, -3%, 0) scale(1.05)' },
          '66%': { transform: 'translate3d(-2%, 2%, 0) scale(0.98)' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideDown: 'slideDown 0.18s ease-out',
        riseIn: 'riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'aurora-drift': 'auroraDrift 34s ease-in-out infinite',
        'orb-float': 'orbFloat 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
