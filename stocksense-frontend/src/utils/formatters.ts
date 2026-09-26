/**
 * Format a number with locale-aware comma separators.
 * e.g., 4820 → "4,820"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format a quantity with unit of measure.
 * e.g., (77, "kg") → "77 kg"
 */
export function formatQuantity(value: number, uom?: string): string {
  const formatted = formatNumber(value);
  return uom ? `${formatted} ${uom}` : formatted;
}

/**
 * Format a date string to relative time (e.g., "2 min ago").
 * Falls back to absolute date for older dates.
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date string to a readable date/time.
 * e.g., "26 Sep 2026, 10:30 AM"
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date string to time only.
 * e.g., "10:30 AM"
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get a greeting based on the current hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
