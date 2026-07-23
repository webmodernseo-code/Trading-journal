'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    setThemeState(current);
  }, []);

  function apply(mode: 'dark' | 'light') {
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', mode);
    setThemeState(mode);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border-subtle p-0.5">
      <button
        type="button"
        onClick={() => apply('dark')}
        aria-label="Dark theme"
        className={`flex h-6 w-7 items-center justify-center rounded-full ${
          theme === 'dark' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        <Moon size={13} />
      </button>
      <button
        type="button"
        onClick={() => apply('light')}
        aria-label="Light theme"
        className={`flex h-6 w-7 items-center justify-center rounded-full ${
          theme === 'light' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        <Sun size={13} />
      </button>
    </div>
  );
}
