/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // ── ConfidentAI brand tokens ──────────────────────────
        brand: {
          purple:     '#7c3aed',
          'purple-l': '#a855f7',
          'purple-d': '#5b21b6',
          cyan:       '#06b6d4',
          'cyan-l':   '#22d3ee',
          success:    '#10b981',
          warning:    '#f59e0b',
          danger:     '#ef4444',
        },
        'bg-base':     'var(--bg-base)',
        'bg-surface':  'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%,100%': { boxShadow: '0 0 20px rgba(124,58,237,0.3)' },
          '50%':     { boxShadow: '0 0 40px rgba(124,58,237,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          to:   { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-up':        'fade-up 0.5s ease both',
        'glow-pulse':     'glow-pulse 2s ease-in-out infinite',
        shimmer:          'shimmer 1.5s infinite',
        float:            'float 4s ease-in-out infinite',
        orbit:            'orbit 8s linear infinite',
        spin:             'spin 1s linear infinite',
        pulse:            'pulse 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-brand':    'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        'gradient-card':     'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.05) 100%)',
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        glow:    '0 0 40px rgba(124,58,237,0.25)',
        'glow-lg':'0 0 60px rgba(124,58,237,0.4)',
        card:    '0 4px 16px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
