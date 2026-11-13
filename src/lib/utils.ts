// =============================================================================
// Utility functions for formatting and display with explicit null handling
// =============================================================================

/** Format a number to a specified number of decimal places or return 'N/A' if missing */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
}

/** Format a percentage value with % suffix or return 'N/A' if missing */
export function formatPercent(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
}

/** Format a binary 0/1 value as Yes/No or return 'N/A' if missing */
export function formatBinary(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value === 1 ? 'Yes' : 'No';
}

/** Format a State/UT name to title case */
export function toTitleCase(str: string): string {
  if (!str) return '';
  const specialCases: Record<string, string> = {
    'ANDAMAN & NICOBAR ISLANDS': 'Andaman & Nicobar Islands',
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 'Dadra & Nagar Haveli and Daman & Diu',
    'JAMMU & KASHMIR': 'Jammu & Kashmir',
  };
  if (specialCases[str]) return specialCases[str];

  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (['and', 'of', '&'].includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Convert indicator column key to human-readable label */
export function formatIndicatorLabel(key: string): string {
  return key
    .replace(/_Pct$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Calculate the mean of an array of numbers, filtering out missing/null values */
export function mean(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/** Classify a metric score with a qualitative label */
export function classifySilhouette(score: number): { label: string; color: string } {
  if (score >= 0.7) return { label: 'Strong', color: '#16a34a' };
  if (score >= 0.5) return { label: 'Reasonable', color: '#2563eb' };
  if (score >= 0.25) return { label: 'Weak', color: '#d97706' };
  return { label: 'No structure', color: '#dc2626' };
}
