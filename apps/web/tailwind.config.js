/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: {
          primary:   '#0a0a0a',
          secondary: '#111111',
          tertiary:  '#141414',
          card:      '#161616',
          hover:     '#1e1e1e',
        },
        border: {
          DEFAULT: '#1e1e1e',
          subtle:  '#161616',
          strong:  '#2a2a2a',
        },
        text: {
          primary:   '#e8e8e8',
          secondary: '#888888',
          muted:     '#555555',
          dim:       '#333333',
        },
        accent: '#e8e8e8',
      },
      boxShadow: {
        'book':    '4px 6px 20px rgba(0,0,0,0.8), inset -2px 0 6px rgba(0,0,0,0.5)',
        'card':    '0 4px 24px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)',
        'card-lg': '0 12px 48px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)',
        'panel':   '-8px 0 48px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.5rem',
      },
    },
  },
  plugins: [],
}
