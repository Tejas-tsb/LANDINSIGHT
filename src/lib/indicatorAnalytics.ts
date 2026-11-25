import type { EnrichedStateData } from '../types/data';
import { CLUSTER_CONFIG } from './constants';
import { toTitleCase } from './utils';

export interface IndicatorStateRow {
  name: string;
  fullName: string;
  value: number | null;
  cluster: number;
}

export const INDICATOR_CHART_PAGE_SIZE = 12;

/** Read the selected feature directly from each state row, preserving real zeroes and nulls. */
export function buildIndicatorStateRows(
  states: EnrichedStateData[],
  indicatorKey: string,
): IndicatorStateRow[] {
  return states.map((state) => {
    const rawValue = (state as unknown as Record<string, unknown>)[indicatorKey];
    const value = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null;

    return {
      name: toTitleCase(state.State_UT),
      fullName: state.State_UT,
      value,
      cluster: state.Cluster,
    };
  });
}

/** Sort values in either direction while keeping unavailable observations last. */
export function sortIndicatorStateRows(
  rows: IndicatorStateRow[],
  order: 'asc' | 'desc',
): IndicatorStateRow[] {
  return [...rows].sort((a, b) => {
    if (a.value === null && b.value === null) return a.name.localeCompare(b.name);
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    const difference = order === 'desc' ? b.value - a.value : a.value - b.value;
    return difference || a.name.localeCompare(b.name);
  });
}

export function pageIndicatorStateRows(
  rows: IndicatorStateRow[],
  page: number,
  pageSize = INDICATOR_CHART_PAGE_SIZE,
): IndicatorStateRow[] {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(rows.length / safePageSize));
  const safePage = Math.min(Math.max(0, Math.floor(page)), pageCount - 1);
  return rows.slice(safePage * safePageSize, (safePage + 1) * safePageSize);
}

export function clusterColorForIndicatorRow(cluster: number): string {
  return CLUSTER_CONFIG[cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B';
}
