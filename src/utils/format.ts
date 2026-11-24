export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString('en-US');
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString('en-US');
}

export function formatDeltaPct(
  current: number | null,
  previous: number | null
): { label: string; direction: 'up' | 'down' | 'flat' | 'unavailable'; pct: number | null } {
  if (
    current === null ||
    previous === null ||
    Number.isNaN(current) ||
    Number.isNaN(previous) ||
    previous === 0
  ) {
    return { label: 'No prior baseline', direction: 'unavailable', pct: null };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.05) {
    return { label: '0.0%', direction: 'flat', pct: 0 };
  }
  return {
    label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`,
    direction: pct > 0 ? 'up' : 'down',
    pct,
  };
}

export function formatShortDate(isoDateOrTs: string): string {
  const d = new Date(isoDateOrTs.length === 10 ? `${isoDateOrTs}T00:00:00Z` : isoDateOrTs);
  if (Number.isNaN(d.getTime())) return isoDateOrTs;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateTimeUtc(isoTs: string | null): string {
  if (!isoTs) return 'Never';
  const d = new Date(isoTs);
  if (Number.isNaN(d.getTime())) return isoTs;
  return (
    d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }) +
    ' · ' +
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }) +
    ' UTC'
  );
}

export function formatDurationSeconds(seconds: number | null): string {
  if (seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
