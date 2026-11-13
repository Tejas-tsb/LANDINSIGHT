import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeNullableNumber,
  validateColumns,
  validateUniqueStateIdentifiers,
  fetchAndParseCSV,
  loadAllDatasets,
} from './dataLoader';
import { DATA_PATHS } from './constants';

// 36 standard States and Union Territories (7 in Cluster 0, 29 in Cluster 1)
const CLUSTER_0_STATES = [
  'ARUNACHAL PRADESH',
  'DELHI',
  'LADAKH',
  'LAKSHADWEEP',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
];

const CLUSTER_1_STATES = [
  'ANDAMAN & NICOBAR ISLANDS',
  'ANDHRA PRADESH',
  'ASSAM',
  'BIHAR',
  'CHANDIGARH',
  'CHHATTISGARH',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JAMMU & KASHMIR',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'ODISHA',
  'PUDUCHERRY',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'WEST BENGAL',
];

const ALL_36_STATES = [...CLUSTER_0_STATES, ...CLUSTER_1_STATES];

function buildMockGovernanceCSV(states: string[] = ALL_36_STATES): string {
  const header =
    'State_UT,Total_Districts,Total_Villages,Map_Digitization_Pct,Map_GeoReferencing_Pct,Map_RoR_Linkage_Pct,Land_Parcel_GeoReferencing_Pct,Land_Parcel_ULPIN_Pct,RoR_Computerization_Pct,Villages_CLR_Completed_Pct,Updated_Ownership_Districts_Pct,MRR_Completion_Pct_Total,Online_RoR_Download,Digitally_Signed_RoR,Online_Mutation_Application,Auto_Triggered_Mutation,Auto_Mutation';
  const rows = states.map((s, idx) => {
    // Inject some null / empty / valid values
    return `${s},${idx + 1},${(idx + 1) * 100},95.5,50.0,60.0,70.0,80.0,99.0,98.0,25.0,55.0,1,1,1,1,0`;
  });
  return [header, ...rows].join('\n');
}

function buildMockAssignmentsCSV(states: string[] = ALL_36_STATES): string {
  const header = 'State_UT,Cluster,Cluster_Size,Cluster_Percentage,Model,K';
  const rows = states.map((s) => {
    const isC0 = CLUSTER_0_STATES.includes(s);
    const cluster = isC0 ? 0 : 1;
    const size = isC0 ? 7 : 29;
    const pct = isC0 ? 19.444444 : 80.555556;
    return `${s},${cluster},${size},${pct},Model C,2`;
  });
  return [header, ...rows].join('\n');
}

function buildMockMetricsCSV(): string {
  return `Model,Feature_Count,K,WCSS,Silhouette_Score,Davies_Bouldin_Index,Mean_ARI,Std_ARI
Model C,13,2,304.73,0.4076,1.1524,1.0,0.0`;
}

function buildMockProfilesCSV(): string {
  return `Cluster,State_UT_Count,Cluster_Percentage,Map_Digitization_Pct,Map_GeoReferencing_Pct,Map_RoR_Linkage_Pct,Land_Parcel_GeoReferencing_Pct,Land_Parcel_ULPIN_Pct,RoR_Computerization_Pct,Villages_CLR_Completed_Pct,Updated_Ownership_Districts_Pct,MRR_Completion_Pct_Total,Online_RoR_Download,Digitally_Signed_RoR,Online_Mutation_Application,Auto_Triggered_Mutation
0,7,19.444444,50.95,15.02,14.78,16.11,8.13,66.80,44.76,32.40,21.80,28.57,0.0,14.28,14.28
1,29,80.555556,94.68,57.56,67.19,72.64,65.86,98.84,97.40,24.42,57.77,100.0,82.76,86.21,89.66`;
}

function buildMockGapsCSV(): string {
  return `Gap_Rank,Feature,Category,Cluster_0_Mean,Cluster_1_Mean,Difference_C1_minus_C0,Absolute_Gap
1,Digitally_Signed_RoR,Binary Adoption,0.0,82.76,82.76,82.76`;
}

describe('dataLoader: sanitizeNullableNumber', () => {
  it('correctly handles valid numbers', () => {
    expect(sanitizeNullableNumber(0)).toBe(0);
    expect(sanitizeNullableNumber(100)).toBe(100);
    expect(sanitizeNullableNumber(-42.5)).toBe(-42.5);
    expect(sanitizeNullableNumber(0.001)).toBe(0.001);
  });

  it('correctly parses valid numeric strings', () => {
    expect(sanitizeNullableNumber('0')).toBe(0);
    expect(sanitizeNullableNumber('99.9')).toBe(99.9);
    expect(sanitizeNullableNumber(' -12.4 ')).toBe(-12.4);
  });

  it('preserves null, undefined, empty strings, and whitespace as null', () => {
    expect(sanitizeNullableNumber(null)).toBeNull();
    expect(sanitizeNullableNumber(undefined)).toBeNull();
    expect(sanitizeNullableNumber('')).toBeNull();
    expect(sanitizeNullableNumber('   ')).toBeNull();
  });

  it('converts NaN, null, and invalid tokens to null', () => {
    expect(sanitizeNullableNumber('NaN')).toBeNull();
    expect(sanitizeNullableNumber('nan')).toBeNull();
    expect(sanitizeNullableNumber('NULL')).toBeNull();
    expect(sanitizeNullableNumber('null')).toBeNull();
    expect(sanitizeNullableNumber(Number.NaN)).toBeNull();
    expect(sanitizeNullableNumber(Infinity)).toBeNull();
    expect(sanitizeNullableNumber(-Infinity)).toBeNull();
    expect(sanitizeNullableNumber('invalid_str')).toBeNull();
    expect(sanitizeNullableNumber('N/A')).toBeNull();
  });
});

describe('dataLoader: validateColumns', () => {
  it('passes when all required columns are present in the sample record', () => {
    const records = [{ colA: 1, colB: 2, colC: 'test' }];
    expect(() => validateColumns(records, ['colA', 'colB'], 'test.csv')).not.toThrow();
  });

  it('throws descriptive Data Integrity Error when dataset is empty', () => {
    expect(() => validateColumns([], ['colA'], 'empty.csv')).toThrow(
      'Data Integrity Error: Empty dataset received from empty.csv'
    );
  });

  it('throws descriptive Data Integrity Error listing missing columns', () => {
    const records = [{ colA: 1 }];
    expect(() => validateColumns(records, ['colA', 'colB', 'colC'], 'sample.csv')).toThrow(
      'Data Integrity Error in sample.csv: Missing required columns: [colB, colC]'
    );
  });
});

describe('dataLoader: validateUniqueStateIdentifiers', () => {
  it('returns a sanitized map for unique state identifiers', () => {
    const records = [
      { State_UT: 'Andhra Pradesh', value: 10 },
      { State_UT: 'Gujarat ', value: 20 },
    ];
    const map = validateUniqueStateIdentifiers(records, 'test.csv');
    expect(map.size).toBe(2);
    expect(map.has('ANDHRA PRADESH')).toBe(true);
    expect(map.has('GUJARAT')).toBe(true);
  });

  it('detects and throws on empty or missing State_UT values', () => {
    const records = [
      { State_UT: 'Gujarat', value: 1 },
      { State_UT: '', value: 2 },
      { State_UT: '   ', value: 3 },
    ];
    expect(() => validateUniqueStateIdentifiers(records, 'test.csv')).toThrow(
      'Data Integrity Error in test.csv: Empty or missing State_UT identifier detected at row(s): [2, 3]'
    );
  });

  it('detects and throws on duplicate State_UT identifiers with case insensitivity', () => {
    const records = [
      { State_UT: 'Delhi' },
      { State_UT: 'Goa' },
      { State_UT: 'DELHI ' },
    ];
    expect(() => validateUniqueStateIdentifiers(records, 'test.csv')).toThrow(
      'Data Integrity Error in test.csv: Duplicate State/UT identifiers detected: ["DELHI" (row 3)]'
    );
  });
});

describe('dataLoader: fetchAndParseCSV', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses CSV text with header trimming and dynamic typing', async () => {
    const mockCSV = `Name , Age , Score \nAlice, 30, 95.5\nBob, 25, 88.0`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockCSV,
    }));

    const result = await fetchAndParseCSV<{ Name: string; Age: number; Score: number }>(
      '/test.csv'
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Name: 'Alice', Age: 30, Score: 95.5 });
    expect(result[1]).toEqual({ Name: 'Bob', Age: 25, Score: 88.0 });
  });

  it('throws descriptive error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }));

    await expect(fetchAndParseCSV('/missing.csv')).rejects.toThrow(
      'Data loading failure for /missing.csv: Failed to fetch /missing.csv: HTTP status 404 Not Found'
    );
  });

  it('skips empty lines properly', async () => {
    const mockCSV = `ColA,ColB\n1,2\n\n3,4\n\n`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockCSV,
    }));

    const result = await fetchAndParseCSV('/empty_lines.csv');
    expect(result).toHaveLength(2);
  });
});

describe('dataLoader: loadAllDatasets end-to-end integration', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockImplementation((url: string) => {
      let body = '';
      if (url === DATA_PATHS.governance) {
        body = buildMockGovernanceCSV();
      } else if (url === DATA_PATHS.clusterAssignments) {
        body = buildMockAssignmentsCSV();
      } else if (url === DATA_PATHS.modelMetrics) {
        body = buildMockMetricsCSV();
      } else if (url === DATA_PATHS.clusterProfiles) {
        body = buildMockProfilesCSV();
      } else if (url === DATA_PATHS.gapAnalysis) {
        body = buildMockGapsCSV();
      } else {
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => body,
      });
    });

    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads, parses, sanitizes, and joins all 36 states successfully', async () => {
    const appData = await loadAllDatasets();

    expect(appData.states).toHaveLength(36);
    expect(appData.clusterAssignments).toHaveLength(36);
    expect(appData.enrichedStates).toHaveLength(36);
    expect(appData.modelMetrics).toHaveLength(1);
    expect(appData.clusterProfiles).toHaveLength(2);
    expect(appData.gapAnalysis).toHaveLength(1);

    // Verify Cluster 0 vs Cluster 1 distributions
    const c0States = appData.enrichedStates.filter((s) => s.Cluster === 0);
    const c1States = appData.enrichedStates.filter((s) => s.Cluster === 1);
    expect(c0States).toHaveLength(7);
    expect(c1States).toHaveLength(29);

    // Verify enriched join properties
    const sampleState = appData.enrichedStates.find((s) => s.State_UT === 'DELHI');
    expect(sampleState).toBeDefined();
    expect(sampleState?.Cluster).toBe(0);
    expect(sampleState?.Cluster_Size).toBe(7);
    expect(sampleState?.Cluster_Percentage).toBeCloseTo(19.444, 2);
  });

  it('preserves null values in governance indicators without coercing to zero', async () => {
    // Inject explicit null / empty fields into governance data
    const customGovCSV = `State_UT,Total_Districts,Total_Villages,Map_Digitization_Pct,Map_GeoReferencing_Pct,Map_RoR_Linkage_Pct,Land_Parcel_GeoReferencing_Pct,Land_Parcel_ULPIN_Pct,RoR_Computerization_Pct,Villages_CLR_Completed_Pct,Updated_Ownership_Districts_Pct,MRR_Completion_Pct_Total,Online_RoR_Download,Digitally_Signed_RoR,Online_Mutation_Application,Auto_Triggered_Mutation,Auto_Mutation\n` +
      ALL_36_STATES.map((s) => {
        if (s === 'LAKSHADWEEP') {
          // Provide exactly 17 fields: explicit null/empty/NaN values and one explicit 0 for MRR
          return `${s},1,,NaN,,10.5,,,,,,0,1,0,,0,0`;
        }
        return `${s},10,100,50,50,50,50,50,50,50,50,50,1,1,1,1,0`;
      }).join('\n');

    mockFetch.mockImplementation((url: string) => {
      if (url === DATA_PATHS.governance) {
        return Promise.resolve({ ok: true, text: async () => customGovCSV });
      }
      if (url === DATA_PATHS.clusterAssignments) {
        return Promise.resolve({ ok: true, text: async () => buildMockAssignmentsCSV() });
      }
      if (url === DATA_PATHS.modelMetrics) {
        return Promise.resolve({ ok: true, text: async () => buildMockMetricsCSV() });
      }
      if (url === DATA_PATHS.clusterProfiles) {
        return Promise.resolve({ ok: true, text: async () => buildMockProfilesCSV() });
      }
      if (url === DATA_PATHS.gapAnalysis) {
        return Promise.resolve({ ok: true, text: async () => buildMockGapsCSV() });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const appData = await loadAllDatasets();
    const lakshadweep = appData.enrichedStates.find((s) => s.State_UT === 'LAKSHADWEEP');
    expect(lakshadweep).toBeDefined();
    expect(lakshadweep?.Total_Villages).toBeNull();
    expect(lakshadweep?.Map_Digitization_Pct).toBeNull();
    expect(lakshadweep?.Map_GeoReferencing_Pct).toBeNull();
    expect(lakshadweep?.Map_RoR_Linkage_Pct).toBe(10.5);
    expect(lakshadweep?.MRR_Completion_Pct_Total).toBe(0); // Explicit 0 is preserved
  });

  it('throws Data Integrity Error when a required column is missing from governance dataset', async () => {
    // Omit 'RoR_Computerization_Pct'
    const malformedGov = `State_UT,Total_Districts,Total_Villages,Map_Digitization_Pct,Map_GeoReferencing_Pct,Map_RoR_Linkage_Pct,Land_Parcel_GeoReferencing_Pct,Land_Parcel_ULPIN_Pct,Villages_CLR_Completed_Pct,Updated_Ownership_Districts_Pct,MRR_Completion_Pct_Total,Online_RoR_Download,Digitally_Signed_RoR,Online_Mutation_Application,Auto_Triggered_Mutation,Auto_Mutation\nDelhi,1,10,100,100,100,100,100,100,100,100,1,1,1,1,0`;

    mockFetch.mockImplementation((url: string) => {
      if (url === DATA_PATHS.governance) {
        return Promise.resolve({ ok: true, text: async () => malformedGov });
      }
      if (url === DATA_PATHS.clusterAssignments) {
        return Promise.resolve({ ok: true, text: async () => buildMockAssignmentsCSV() });
      }
      if (url === DATA_PATHS.modelMetrics) {
        return Promise.resolve({ ok: true, text: async () => buildMockMetricsCSV() });
      }
      if (url === DATA_PATHS.clusterProfiles) {
        return Promise.resolve({ ok: true, text: async () => buildMockProfilesCSV() });
      }
      if (url === DATA_PATHS.gapAnalysis) {
        return Promise.resolve({ ok: true, text: async () => buildMockGapsCSV() });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    await expect(loadAllDatasets()).rejects.toThrow(
      'Data Integrity Error in Cleaned_Digital_Land_Governance.csv: Missing required columns: [RoR_Computerization_Pct]'
    );
  });

  it('throws Data Integrity Error when unmatched states exist in governance data', async () => {
    // 36 states with one non-standard state name 'UNKNOWN_TERRITORY'
    const modifiedStates = [...ALL_36_STATES.slice(0, 35), 'UNKNOWN_TERRITORY'];
    const customGov = buildMockGovernanceCSV(modifiedStates);

    mockFetch.mockImplementation((url: string) => {
      if (url === DATA_PATHS.governance) {
        return Promise.resolve({ ok: true, text: async () => customGov });
      }
      if (url === DATA_PATHS.clusterAssignments) {
        return Promise.resolve({ ok: true, text: async () => buildMockAssignmentsCSV() });
      }
      if (url === DATA_PATHS.modelMetrics) {
        return Promise.resolve({ ok: true, text: async () => buildMockMetricsCSV() });
      }
      if (url === DATA_PATHS.clusterProfiles) {
        return Promise.resolve({ ok: true, text: async () => buildMockProfilesCSV() });
      }
      if (url === DATA_PATHS.gapAnalysis) {
        return Promise.resolve({ ok: true, text: async () => buildMockGapsCSV() });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    await expect(loadAllDatasets()).rejects.toThrow(
      'Data Integrity Error: Found 1 State/UT record(s) in Cleaned_Digital_Land_Governance.csv with no matching cluster assignment: [UNKNOWN_TERRITORY]'
    );
  });

  it('throws Data Integrity Error when unmatched states exist in cluster assignments', async () => {
    // Assignments has 'EXTRA_STATE'
    const modifiedAssignmentsStates = [...ALL_36_STATES, 'EXTRA_STATE'];
    const customAssignments = buildMockAssignmentsCSV(modifiedAssignmentsStates);

    mockFetch.mockImplementation((url: string) => {
      if (url === DATA_PATHS.governance) {
        return Promise.resolve({ ok: true, text: async () => buildMockGovernanceCSV() });
      }
      if (url === DATA_PATHS.clusterAssignments) {
        return Promise.resolve({ ok: true, text: async () => customAssignments });
      }
      if (url === DATA_PATHS.modelMetrics) {
        return Promise.resolve({ ok: true, text: async () => buildMockMetricsCSV() });
      }
      if (url === DATA_PATHS.clusterProfiles) {
        return Promise.resolve({ ok: true, text: async () => buildMockProfilesCSV() });
      }
      if (url === DATA_PATHS.gapAnalysis) {
        return Promise.resolve({ ok: true, text: async () => buildMockGapsCSV() });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    await expect(loadAllDatasets()).rejects.toThrow(
      'Data Integrity Error: Found 1 State/UT record(s) in Final_State_UT_Cluster_Assignments.csv with no matching governance data: [EXTRA_STATE]'
    );
  });

  it('throws Data Integrity Error when total processed count is not 36', async () => {
    // Only 35 states present in both datasets
    const reducedStates = ALL_36_STATES.slice(0, 35);

    mockFetch.mockImplementation((url: string) => {
      if (url === DATA_PATHS.governance) {
        return Promise.resolve({ ok: true, text: async () => buildMockGovernanceCSV(reducedStates) });
      }
      if (url === DATA_PATHS.clusterAssignments) {
        return Promise.resolve({ ok: true, text: async () => buildMockAssignmentsCSV(reducedStates) });
      }
      if (url === DATA_PATHS.modelMetrics) {
        return Promise.resolve({ ok: true, text: async () => buildMockMetricsCSV() });
      }
      if (url === DATA_PATHS.clusterProfiles) {
        return Promise.resolve({ ok: true, text: async () => buildMockProfilesCSV() });
      }
      if (url === DATA_PATHS.gapAnalysis) {
        return Promise.resolve({ ok: true, text: async () => buildMockGapsCSV() });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    await expect(loadAllDatasets()).rejects.toThrow(
      'Data Integrity Error: Expected 36 States/UTs, but processed 35'
    );
  });

  it('throws error when any dataset fetch fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === DATA_PATHS.governance) {
        return Promise.resolve({ ok: false, status: 500, statusText: 'Internal Server Error' });
      }
      if (url === DATA_PATHS.clusterAssignments) {
        return Promise.resolve({ ok: true, text: async () => buildMockAssignmentsCSV() });
      }
      if (url === DATA_PATHS.modelMetrics) {
        return Promise.resolve({ ok: true, text: async () => buildMockMetricsCSV() });
      }
      if (url === DATA_PATHS.clusterProfiles) {
        return Promise.resolve({ ok: true, text: async () => buildMockProfilesCSV() });
      }
      if (url === DATA_PATHS.gapAnalysis) {
        return Promise.resolve({ ok: true, text: async () => buildMockGapsCSV() });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    await expect(loadAllDatasets()).rejects.toThrow('Data loading failure for /data/Cleaned_Digital_Land_Governance.csv');
  });
});

describe('dataLoader: Real Dataset Audit & Integration Smoke Tests', () => {
  beforeEach(() => {
    // Adapter that reads actual files from public directory on disk
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const cleanPath = url.replace(/^\//, '');
      const filePath = path.resolve(process.cwd(), 'public', cleanPath);
      if (!fs.existsSync(filePath)) {
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
      }
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => fileContent,
      });
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully loads, parses, validates, and joins the actual 5 production CSV datasets', async () => {
    const appData = await loadAllDatasets();

    // Verify dimensions
    expect(appData.states).toHaveLength(36);
    expect(appData.clusterAssignments).toHaveLength(36);
    expect(appData.enrichedStates).toHaveLength(36);
    expect(appData.modelMetrics).toHaveLength(15);
    expect(appData.clusterProfiles).toHaveLength(2);
    expect(appData.gapAnalysis).toHaveLength(13);
  });

  it('verifies 36 unique State/UTs with zero unmatched records between governance and assignments', async () => {
    const appData = await loadAllDatasets();
    const govStateNames = appData.states.map((s) => s.State_UT.trim().toUpperCase());
    const assignStateNames = appData.clusterAssignments.map((s) => s.State_UT.trim().toUpperCase());

    expect(new Set(govStateNames).size).toBe(36);
    expect(new Set(assignStateNames).size).toBe(36);

    // Exact 1-to-1 matching
    const unassigned = govStateNames.filter((s) => !assignStateNames.includes(s));
    const unrepresented = assignStateNames.filter((s) => !govStateNames.includes(s));
    expect(unassigned).toHaveLength(0);
    expect(unrepresented).toHaveLength(0);
  });

  it('verifies cluster distribution: Cluster 0 (7 States/UTs, 19.44%) and Cluster 1 (29 States/UTs, 80.56%)', async () => {
    const appData = await loadAllDatasets();
    const c0 = appData.enrichedStates.filter((s) => s.Cluster === 0);
    const c1 = appData.enrichedStates.filter((s) => s.Cluster === 1);

    expect(c0).toHaveLength(7);
    expect(c1).toHaveLength(29);

    const c0Names = c0.map((s) => s.State_UT).sort();
    const expectedC0Names = [
      'ARUNACHAL PRADESH',
      'DELHI',
      'LADAKH',
      'LAKSHADWEEP',
      'MEGHALAYA',
      'MIZORAM',
      'NAGALAND',
    ].sort();
    expect(c0Names).toEqual(expectedC0Names);

    // Verify assigned percentage values
    expect(c0[0].Cluster_Size).toBe(7);
    expect(c0[0].Cluster_Percentage).toBeCloseTo(19.4444, 3);
    expect(c1[0].Cluster_Size).toBe(29);
    expect(c1[0].Cluster_Percentage).toBeCloseTo(80.5556, 3);
  });

  it('verifies exact Model C, K=2 evaluation metrics against Final_Model_Evaluation_Metrics.csv', async () => {
    const appData = await loadAllDatasets();
    const modelCRun = appData.modelMetrics.find(
      (m) => m.Model === 'Model C' && m.K === 2
    );

    expect(modelCRun).toBeDefined();
    expect(modelCRun?.Feature_Count).toBe(13);
    expect(modelCRun?.Silhouette_Score).toBeCloseTo(0.4076, 4);
    expect(modelCRun?.Silhouette_Score).toBe(0.4075831908109508);
    expect(modelCRun?.Davies_Bouldin_Index).toBeCloseTo(1.152433, 5);
    expect(modelCRun?.Davies_Bouldin_Index).toBe(1.1524325434856664);
    expect(modelCRun?.Mean_ARI).toBe(1.0);
    expect(modelCRun?.Std_ARI).toBe(0.0);
    expect(modelCRun?.WCSS).toBeCloseTo(304.7327, 4);
    expect(modelCRun?.WCSS).toBe(304.7327380301655);
  });

  it('verifies cluster profiles dimensions and values against expected Model C 13-feature definitions', async () => {
    const appData = await loadAllDatasets();
    expect(appData.clusterProfiles).toHaveLength(2);

    const p0 = appData.clusterProfiles.find((p) => p.Cluster === 0);
    const p1 = appData.clusterProfiles.find((p) => p.Cluster === 1);

    expect(p0).toBeDefined();
    expect(p1).toBeDefined();
    expect(p0?.State_UT_Count).toBe(7);
    expect(p1?.State_UT_Count).toBe(29);
    expect(p0?.Cluster_Percentage).toBeCloseTo(19.444, 2);
    expect(p1?.Cluster_Percentage).toBeCloseTo(80.556, 2);

    // Check specific feature means
    expect(p0?.Map_Digitization_Pct).toBeCloseTo(50.95, 2);
    expect(p1?.Map_Digitization_Pct).toBeCloseTo(94.68, 2);
    expect(p0?.RoR_Computerization_Pct).toBeCloseTo(66.80, 2);
    expect(p1?.RoR_Computerization_Pct).toBeCloseTo(98.84, 2);
    expect(p0?.Digitally_Signed_RoR).toBe(0.0);
    expect(p1?.Digitally_Signed_RoR).toBeCloseTo(82.76, 2);
  });

  it('verifies gap analysis dimensions, feature ranks, and calculated absolute gaps', async () => {
    const appData = await loadAllDatasets();
    expect(appData.gapAnalysis).toHaveLength(13);

    const rank1 = appData.gapAnalysis.find((g) => g.Gap_Rank === 1);
    expect(rank1).toBeDefined();
    expect(rank1?.Feature).toBe('Digitally_Signed_RoR');
    expect(rank1?.Category).toBe('Binary Adoption');
    expect(rank1?.Cluster_0_Mean).toBe(0.0);
    expect(rank1?.Cluster_1_Mean).toBeCloseTo(82.76, 2);
    expect(rank1?.Absolute_Gap).toBeCloseTo(82.76, 2);

    const rank13 = appData.gapAnalysis.find((g) => g.Gap_Rank === 13);
    expect(rank13).toBeDefined();
    expect(rank13?.Feature).toBe('Updated_Ownership_Districts_Pct');
    expect(rank13?.Cluster_0_Mean).toBeCloseTo(32.40, 2);
    expect(rank13?.Cluster_1_Mean).toBeCloseTo(24.42, 2);
    expect(rank13?.Difference_C1_minus_C0).toBeCloseTo(-7.97, 2);
    expect(rank13?.Absolute_Gap).toBeCloseTo(7.97, 2);
  });

  it('verifies all numeric fields across all 36 real states conform to bounded percentage and binary types', async () => {
    const appData = await loadAllDatasets();

    const percentageCols = [
      'Map_Digitization_Pct',
      'Map_GeoReferencing_Pct',
      'Map_RoR_Linkage_Pct',
      'Land_Parcel_GeoReferencing_Pct',
      'Land_Parcel_ULPIN_Pct',
      'RoR_Computerization_Pct',
      'Villages_CLR_Completed_Pct',
      'Updated_Ownership_Districts_Pct',
      'MRR_Completion_Pct_Total',
    ] as const;

    const binaryCols = [
      'Online_RoR_Download',
      'Digitally_Signed_RoR',
      'Online_Mutation_Application',
      'Auto_Triggered_Mutation',
      'Auto_Mutation',
    ] as const;

    appData.enrichedStates.forEach((state) => {
      expect(state.Total_Districts).toBeGreaterThan(0);
      expect(state.Total_Villages).toBeGreaterThan(0);

      percentageCols.forEach((col) => {
        const val = state[col];
        expect(val).not.toBeNull();
        expect(typeof val).toBe('number');
        expect(Number.isFinite(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      });

      binaryCols.forEach((col) => {
        const val = state[col];
        expect(val).not.toBeNull();
        expect([0, 1]).toContain(val);
      });
    });
  });
});
