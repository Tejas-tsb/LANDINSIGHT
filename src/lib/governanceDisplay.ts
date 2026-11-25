/** Format a nullable percentage without conflating zero with missing data. */
export function formatGovernancePercent(value: number | null, digits = 1): string {
  return value === null || !Number.isFinite(value) ? 'N/A' : `${value.toFixed(digits)}%`;
}

/** Binary 0 is a reported non-availability; null means the source is missing. */
export function formatServiceAvailability(value: number | null): string {
  if (value === 1) return 'Available';
  if (value === 0) return 'Unavailable';
  return 'N/A';
}
