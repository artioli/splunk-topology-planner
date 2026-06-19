const THEME_KEY = 'splunk-planner-theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

function resolveSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? resolveSystemTheme() : mode;
}

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.themePreference = mode;
  document.documentElement.dataset.theme = resolveTheme(mode);
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function initTheme(): void {
  applyTheme(getStoredTheme());

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (mediaListener) {
    mediaQuery.removeEventListener('change', mediaListener);
  }
  mediaListener = () => {
    if (getStoredTheme() === 'system') {
      document.documentElement.dataset.theme = resolveSystemTheme();
    }
  };
  mediaQuery.addEventListener('change', mediaListener);
}

export function cycleTheme(): ThemeMode {
  const order: ThemeMode[] = ['system', 'light', 'dark'];
  const current = getStoredTheme();
  const next = order[(order.indexOf(current) + 1) % order.length];
  applyTheme(next);
  return next;
}

export function themeToggleLabel(mode: ThemeMode): string {
  if (mode === 'light') return 'Light';
  if (mode === 'dark') return 'Dark';
  return 'Auto';
}
