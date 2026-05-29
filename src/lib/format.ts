export function gbToTb(gb: number): number {
  return gb / 1024;
}

export function roundTb(tb: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(tb * factor) / factor;
}

export function formatTb(tb: number): string {
  return `${roundTb(tb)} TB`;
}

export function formatGb(gb: number): string {
  if (gb >= 1024) return formatTb(gbToTb(gb));
  return `${Math.round(gb)} GB`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
