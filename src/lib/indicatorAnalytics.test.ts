import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { BINARY_INDICATORS, CLUSTER_CONFIG, PERCENTAGE_INDICATORS } from './constants';
import { sanitizeNullableNumber } from './dataLoader';
import {
  buildIndicatorStateRows,
  clusterColorForIndicatorRow,
  INDICATOR_CHART_PAGE_SIZE,
  pageIndicatorStateRows,
  sortIndicatorStateRows,
  type IndicatorStateRow,
} from './indicatorAnalytics';
import type { EnrichedStateData, StateGovernanceData } from '../types/data';

const publicPath = (file: string) => path.resolve(process.cwd(), 'public/data', file);
const rawCsv = fs.readFileSync(publicPath('Cleaned_Digital_Land_Governance.csv'), 'utf8');
const sourceRows = Papa.parse<Record<string, unknown>>(rawCsv, { header: true, skipEmptyLines: true }).data;
const explorer = JSON.parse(fs.readFileSync(publicPath('LANDINSIGHT_Cluster_Explorer_Data.json'), 'utf8')) as {
  configurations: { id: string; k: number }[];
  assignments: { Config_ID: string; State_UT: string; Cluster: number }[];
};
const indicatorKeys = [...PERCENTAGE_INDICATORS, ...BINARY_INDICATORS];

function toState(row: Record<string, unknown>): StateGovernanceData {
  const state = { State_UT: String(row.State_UT) } as StateGovernanceData;
  for (const key of indicatorKeys) {
    (state as unknown as Record<string, unknown>)[key] = sanitizeNullableNumber(row[key]);
  }
  return state;
}

describe('Indicator Analytics transformation', () => {
  it('maps every raw indicator value and configuration assignment to its State/UT row', () => {
    const sourceByName = new Map(sourceRows.map((row) => [String(row.State_UT).trim().toUpperCase(), row]));

    for (const config of explorer.configurations) {
      const assignmentByName = new Map(
        explorer.assignments
          .filter((assignment) => assignment.Config_ID === config.id)
          .map((assignment) => [assignment.State_UT.trim().toUpperCase(), assignment.Cluster]),
      );
      const states = sourceRows.map((source) => ({
        ...toState(source),
        Cluster: assignmentByName.get(String(source.State_UT).trim().toUpperCase())!,
        Cluster_Size: 0,
        Cluster_Percentage: 0,
      } as EnrichedStateData));

      expect(states).toHaveLength(36);
      expect(new Set(states.map((state) => state.State_UT)).size).toBe(36);
      expect(states.every((state) => state.Cluster < config.k)).toBe(true);

      for (const indicatorKey of indicatorKeys) {
        const rows = buildIndicatorStateRows(states, indicatorKey);
        expect(rows).toHaveLength(36);
        for (const row of rows) {
          const source = sourceByName.get(row.fullName.trim().toUpperCase())!;
          const assignment = assignmentByName.get(row.fullName.trim().toUpperCase());
          expect(row.value).toBe(sanitizeNullableNumber(source[indicatorKey]));
          expect(row.cluster).toBe(assignment);
          expect(clusterColorForIndicatorRow(row.cluster)).toBe(CLUSTER_CONFIG[row.cluster as keyof typeof CLUSTER_CONFIG].color);
          if (PERCENTAGE_INDICATORS.includes(indicatorKey) && row.value !== null) {
            expect(row.value).toBeGreaterThanOrEqual(0);
            expect(row.value).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });

  it('keeps zero separate from missing values and sorts unavailable rows last in either direction', () => {
    const states = [
      { State_UT: 'ZERO STATE', Map_Digitization_Pct: 0, Cluster: 0 },
      { State_UT: 'FULL STATE', Map_Digitization_Pct: 100, Cluster: 1 },
      { State_UT: 'MISSING STATE', Map_Digitization_Pct: null, Cluster: 1 },
    ] as unknown as EnrichedStateData[];

    const rows = buildIndicatorStateRows(states, 'Map_Digitization_Pct');
    expect(rows.find((row) => row.fullName === 'ZERO STATE')?.value).toBe(0);
    expect(rows.find((row) => row.fullName === 'MISSING STATE')?.value).toBeNull();
    expect(sortIndicatorStateRows(rows, 'desc').map((row) => row.fullName)).toEqual([
      'FULL STATE', 'ZERO STATE', 'MISSING STATE',
    ]);
    expect(sortIndicatorStateRows(rows, 'asc').map((row) => row.fullName)).toEqual([
      'ZERO STATE', 'FULL STATE', 'MISSING STATE',
    ]);
  });

  it('keeps all 36 sorted states accessible through compact chart pages', () => {
    const states = sourceRows.map((row, cluster) => ({
      ...toState(row), Cluster: cluster % 5, Cluster_Size: 0, Cluster_Percentage: 0,
    } as EnrichedStateData));
    const sortedRows = sortIndicatorStateRows(buildIndicatorStateRows(states, 'Map_Digitization_Pct'), 'desc');
    const pages: IndicatorStateRow[][] = [];
    for (let page = 0; page < Math.ceil(sortedRows.length / INDICATOR_CHART_PAGE_SIZE); page += 1) {
      pages.push(pageIndicatorStateRows(sortedRows, page));
    }
    expect(pages.map((page) => page.length)).toEqual([12, 12, 12]);
    expect(pages.flat().map((row) => row.fullName)).toEqual(sortedRows.map((row) => row.fullName));
    expect(pageIndicatorStateRows(sortedRows, 999)).toEqual(pages[2]);
  });
});
