'use client';

import { useEffect, useState } from 'react';

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
        className={`flex h-5 w-6 items-center justify-center rounded-full text-[10px] ${
          theme === 'dark' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        ●
      </button>
      <button
        type="button"
        onClick={() => apply('light')}
        aria-label="Light theme"
        className={`flex h-5 w-6 items-center justify-center rounded-full text-[10px] ${
          theme === 'light' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        ○
      </button>
    </div>
  );
}
