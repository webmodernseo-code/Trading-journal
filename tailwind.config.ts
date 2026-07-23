import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        sidebar: 'var(--color-sidebar)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'border-subtle': 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
        gain: 'var(--color-gain)',
        'gain-dim': 'var(--color-gain-dim)',
        loss: 'var(--color-loss)',
        'loss-dim': 'var(--color-loss-dim)',
        'text-primary': 'var(--color-text)',
        'text-muted': 'var(--color-muted)',
        'text-faint': 'var(--color-faint)',
        cta: 'var(--color-cta)',
        info: 'var(--color-info)',
        'info-dim': 'var(--color-info-dim)',
        warning: 'var(--color-warning)',
        'warning-dim': 'var(--color-warning-dim)',
        'asset-commodity': 'var(--color-asset-commodity)',
        'asset-commodity-dim': 'var(--color-asset-commodity-dim)',
        'asset-index': 'var(--color-asset-index)',
        'asset-index-dim': 'var(--color-asset-index-dim)',
      },
    },
  },
  plugins: [],
};

export default config;
