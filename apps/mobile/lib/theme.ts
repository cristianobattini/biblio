export const colors = {
  bg: {
    primary:   '#0a0a0a',
    secondary: '#111111',
    tertiary:  '#141414',
    card:      '#161616',
    hover:     '#1e1e1e',
  },
  border: {
    default: '#1e1e1e',
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
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const

export const font = {
  light:   '300' as const,
  regular: '400' as const,
  medium:  '500' as const,
  semi:    '600' as const,
}
