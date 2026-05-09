/** Shared pure helpers for the admin views (and reusable elsewhere). */

export function formatTokens(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR');
}

export function formatCost(c: number | string | null | undefined): string {
  if (c == null) return '—';
  const v = typeof c === 'string' ? Number(c) : c;
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '$0';
  if (v < 0.0001) return '< $0.0001';
  if (v < 0.01) return '$' + v.toFixed(6);
  if (v < 1) return '$' + v.toFixed(4);
  return '$' + v.toFixed(3);
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return Math.round(ms) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const oneDay = 86_400_000;
  const diff = now.getTime() - d.getTime();
  if (diff < oneDay && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < oneDay * 7) {
    return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}
