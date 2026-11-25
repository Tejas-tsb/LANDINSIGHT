import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { sanitizeNullableNumber } from './dataLoader';
import { getStateForGeoJsonName } from './geoStateMapping';
import { formatGovernancePercent, formatServiceAvailability } from './governanceDisplay';

const dataPath = (file: string) => path.resolve(process.cwd(), 'public/data', file);
const governance = Papa.parse<Record<string, string>>(fs.readFileSync(dataPath('Cleaned_Digital_Land_Governance.csv'), 'utf8'), {
  header: true,
  skipEmptyLines: true,
}).data;
const explorer = JSON.parse(fs.readFileSync(dataPath('LANDINSIGHT_Cluster_Explorer_Data.json'), 'utf8')) as {
  assignments: { Config_ID: string; State_UT: string; Cluster: number }[];
};
const geoJson = JSON.parse(fs.readFileSync(dataPath('india_states.geojson'), 'utf8')) as {
  features: { properties?: { ST_NM?: string } }[];
};

describe('Governance Map state lookup and displayed zero values', () => {
  it.each([
    ['Arunachal Pradesh', 'ARUNACHAL PRADESH'],
    ['Meghalaya', 'MEGHALAYA'],
  ])('maps the %s polygon to its protected source row and configuration assignments', (geoName, sourceName) => {
    expect(geoJson.features.some((feature) => feature.properties?.ST_NM === geoName)).toBe(true);
    const source = governance.find((row) => row.State_UT.trim().toUpperCase() === sourceName);
    expect(source).toBeDefined();
    const defaultAssignment = explorer.assignments.find((assignment) =>
      assignment.Config_ID === 'Model_C_K2' && assignment.State_UT.trim().toUpperCase() === sourceName,
    );
    expect(defaultAssignment).toBeDefined();
    const state = { ...source!, State_UT: source!.State_UT.trim(), Cluster: defaultAssignment!.Cluster };
    const lookup = new Map([[state.State_UT.toUpperCase(), state]]);
    const selectedState = getStateForGeoJsonName(geoName, lookup);

    expect(selectedState).toBe(state);
    expect(selectedState?.Cluster).toBe(0);
    const assignmentChecks = explorer.assignments
      .filter((assignment) => assignment.State_UT.trim().toUpperCase() === sourceName)
      .map(({ Config_ID, Cluster }) => ({ Config_ID, Cluster }));
    expect(assignmentChecks).toEqual([
      { Config_ID: 'Model_C_K2', Cluster: 0 },
      { Config_ID: 'Model_B_K3', Cluster: 2 },
      { Config_ID: 'Model_B_K4', Cluster: 1 },
      { Config_ID: 'Model_B_K5', Cluster: 1 },
    ]);
  });

  it('renders source zeros as 0.0% or Unavailable, while true missing values remain N/A', () => {
    for (const stateName of ['ARUNACHAL PRADESH', 'MEGHALAYA']) {
      const source = governance.find((row) => row.State_UT === stateName)!;
      for (const key of [
        'Map_Digitization_Pct',
        'Map_RoR_Linkage_Pct',
        'RoR_Computerization_Pct',
        'Land_Parcel_ULPIN_Pct',
        'MRR_Completion_Pct_Total',
      ]) {
        expect(sanitizeNullableNumber(source[key])).toBe(0);
        expect(formatGovernancePercent(sanitizeNullableNumber(source[key]))).toBe('0.0%');
      }
      expect(sanitizeNullableNumber(source.Online_RoR_Download)).toBe(0);
      expect(formatServiceAvailability(sanitizeNullableNumber(source.Online_RoR_Download))).toBe('Unavailable');
    }
    expect(formatGovernancePercent(null)).toBe('N/A');
    expect(formatServiceAvailability(null)).toBe('N/A');
  });
});
