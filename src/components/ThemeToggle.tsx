import { Moon, Sun } from '@/components/ui/icons';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  if (typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

let currentTheme: Theme = getInitialTheme();
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function setTheme(next: Theme) {
  currentTheme = next;
  document.documentElement.classList.toggle('dark', next === 'dark');
  localStorage.setItem('theme', next);
  listeners.forEach((listener) => listener());
}

export function useThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot);
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  return { theme, toggleTheme };
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeToggle();
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
