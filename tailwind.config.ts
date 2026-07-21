import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0d10',
        surface: '#12151a',
        'border-subtle': 'rgba(255,255,255,0.06)',
        accent: '#10b981',
        gain: '#34d399',
        loss: '#fb7185',
        'text-primary': '#f3f4f6',
        'text-muted': '#9ca3af',
      },
    },
  },
  plugins: [],
};

export default config;
