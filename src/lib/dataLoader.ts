import Papa from 'papaparse';
import {
  StateGovernanceData,
  ClusterAssignment,
  ModelEvaluationMetric,
  ClusterProfile,
  GapAnalysisEntry,
  EnrichedStateData,
  AppData,
} from '../types/data';
import { DATA_PATHS } from './constants';

/**
 * Safely converts an incoming CSV field into a valid finite number or explicit null.
 * Strictly preserves missing/empty values as null rather than converting them to zero.
 */
function sanitizeNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'nan' || str.toLowerCase() === 'null') {
    return null;
  }
  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Generic PapaParse CSV fetcher and parser with robust error handling.
 */
async function fetchAndParseCSV<T>(
  url: string,
  transformHeader?: (header: string) => string
): Promise<T[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP status ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse<T>(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: transformHeader || ((h) => h.trim()),
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.warn(`CSV Parse warnings in ${url}:`, results.errors);
          }
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(new Error(`CSV parse error in ${url}: ${error.message}`));
        },
      });
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Data loading failure for ${url}: ${msg}`);
  }
}

/**
 * Validates that an array of records contains all required columns.
 */
function validateColumns(records: Record<string, unknown>[], requiredCols: string[], sourceName: string) {
  if (!records || records.length === 0) {
    throw new Error(`Data Integrity Error: Empty dataset received from ${sourceName}`);
  }
  const sample = records[0];
  const missing = requiredCols.filter((col) => !(col in sample));
  if (missing.length > 0) {
    throw new Error(`Data Integrity Error in ${sourceName}: Missing required columns: [${missing.join(', ')}]`);
  }
}

/**
 * Validates uniqueness of State/UT identifiers in a dataset and returns a sanitized Map.
 * Throws a descriptive Data Integrity Error if duplicate or empty identifiers are found.
 */
function validateUniqueStateIdentifiers<T extends { State_UT?: string }>(
  records: T[],
  sourceName: string
): Map<string, T> {
  const map = new Map<string, T>();
  const duplicates: string[] = [];
  const emptyIndices: number[] = [];

  records.forEach((row, index) => {
    const rawName = row.State_UT;
    if (!rawName || typeof rawName !== 'string' || rawName.trim() === '') {
      emptyIndices.push(index + 1);
      return;
    }
    const normalizedKey = rawName.trim().toUpperCase();
    if (map.has(normalizedKey)) {
      duplicates.push(`"${rawName.trim()}" (row ${index + 1})`);
    } else {
      map.set(normalizedKey, row);
    }
  });

  if (emptyIndices.length > 0) {
    throw new Error(
      `Data Integrity Error in ${sourceName}: Empty or missing State_UT identifier detected at row(s): [${emptyIndices.join(', ')}]`
    );
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Data Integrity Error in ${sourceName}: Duplicate State/UT identifiers detected: [${duplicates.join(', ')}]`
    );
  }

  return map;
}

/**
 * Load, validate, and join all 5 CSV datasets with explicit duplicate and unmatched detection.
 */
export async function loadAllDatasets(): Promise<AppData> {
  const [
    rawGovernance,
    rawAssignments,
    rawMetrics,
    rawProfiles,
    rawGaps,
  ] = await Promise.all([
    fetchAndParseCSV<Record<string, unknown>>(DATA_PATHS.governance),
    fetchAndParseCSV<Record<string, unknown>>(DATA_PATHS.clusterAssignments),
    fetchAndParseCSV<ModelEvaluationMetric>(DATA_PATHS.modelMetrics),
    fetchAndParseCSV<Record<string, unknown>>(DATA_PATHS.clusterProfiles),
    fetchAndParseCSV<GapAnalysisEntry>(DATA_PATHS.gapAnalysis),
  ]);

  // 1. Column structure validation
  validateColumns(
    rawGovernance,
    [
      'State_UT',
      'Total_Districts',
      'Total_Villages',
      'Map_Digitization_Pct',
      'Map_GeoReferencing_Pct',
      'Map_RoR_Linkage_Pct',
      'Land_Parcel_GeoReferencing_Pct',
      'Land_Parcel_ULPIN_Pct',
      'RoR_Computerization_Pct',
      'Villages_CLR_Completed_Pct',
      'Updated_Ownership_Districts_Pct',
      'MRR_Completion_Pct_Total',
      'Online_RoR_Download',
      'Digitally_Signed_RoR',
      'Online_Mutation_Application',
      'Auto_Triggered_Mutation',
      'Auto_Mutation',
    ],
    'Cleaned_Digital_Land_Governance.csv'
  );

  validateColumns(
    rawAssignments,
    ['State_UT', 'Cluster', 'Cluster_Size', 'Cluster_Percentage', 'Model', 'K'],
    'Final_State_UT_Cluster_Assignments.csv'
  );

  validateColumns(
    rawMetrics as unknown as Record<string, unknown>[],
    ['Model', 'Feature_Count', 'K', 'WCSS', 'Silhouette_Score', 'Davies_Bouldin_Index', 'Mean_ARI', 'Std_ARI'],
    'Final_Model_Evaluation_Metrics.csv'
  );

  validateColumns(
    rawProfiles,
    [
      'Cluster',
      'State_UT_Count',
      'Cluster_Percentage',
      'Map_Digitization_Pct',
      'Map_GeoReferencing_Pct',
      'Map_RoR_Linkage_Pct',
      'Land_Parcel_GeoReferencing_Pct',
      'Land_Parcel_ULPIN_Pct',
      'RoR_Computerization_Pct',
      'Villages_CLR_Completed_Pct',
      'Updated_Ownership_Districts_Pct',
      'MRR_Completion_Pct_Total',
      'Online_RoR_Download',
      'Digitally_Signed_RoR',
      'Online_Mutation_Application',
      'Auto_Triggered_Mutation',
    ],
    'Final_Cluster_Profiles.csv'
  );

  validateColumns(
    rawGaps as unknown as Record<string, unknown>[],
    ['Gap_Rank', 'Feature', 'Category', 'Cluster_0_Mean', 'Cluster_1_Mean', 'Difference_C1_minus_C0', 'Absolute_Gap'],
    'Cluster_Gap_Analysis.csv'
  );

  // 2. Duplicate State/UT identifier detection
  const typedGovernanceRows = rawGovernance as unknown as StateGovernanceData[];
  const typedAssignmentRows = rawAssignments as unknown as ClusterAssignment[];

  const govMap = validateUniqueStateIdentifiers(typedGovernanceRows, 'Cleaned_Digital_Land_Governance.csv');
  const assignMap = validateUniqueStateIdentifiers(typedAssignmentRows, 'Final_State_UT_Cluster_Assignments.csv');

  // 3. Unmatched State/UT records detection
  const unmatchedInGovernance: string[] = [];
  typedGovernanceRows.forEach((row) => {
    const key = row.State_UT.trim().toUpperCase();
    if (!assignMap.has(key)) {
      unmatchedInGovernance.push(row.State_UT);
    }
  });

  const unmatchedInAssignments: string[] = [];
  typedAssignmentRows.forEach((row) => {
    const key = row.State_UT.trim().toUpperCase();
    if (!govMap.has(key)) {
      unmatchedInAssignments.push(row.State_UT);
    }
  });

  if (unmatchedInGovernance.length > 0) {
    throw new Error(
      `Data Integrity Error: Found ${unmatchedInGovernance.length} State/UT record(s) in Cleaned_Digital_Land_Governance.csv with no matching cluster assignment: [${unmatchedInGovernance.join(', ')}]`
    );
  }

  if (unmatchedInAssignments.length > 0) {
    throw new Error(
      `Data Integrity Error: Found ${unmatchedInAssignments.length} State/UT record(s) in Final_State_UT_Cluster_Assignments.csv with no matching governance data: [${unmatchedInAssignments.join(', ')}]`
    );
  }

  // 4. Sanitize numerical fields to explicitly preserve nulls
  const sanitizedStates: StateGovernanceData[] = typedGovernanceRows.map((row) => ({
    State_UT: row.State_UT.trim(),
    Total_Districts: sanitizeNullableNumber(row.Total_Districts),
    Total_Villages: sanitizeNullableNumber(row.Total_Villages),
    Map_Digitization_Pct: sanitizeNullableNumber(row.Map_Digitization_Pct),
    Map_GeoReferencing_Pct: sanitizeNullableNumber(row.Map_GeoReferencing_Pct),
    Map_RoR_Linkage_Pct: sanitizeNullableNumber(row.Map_RoR_Linkage_Pct),
    Land_Parcel_GeoReferencing_Pct: sanitizeNullableNumber(row.Land_Parcel_GeoReferencing_Pct),
    Land_Parcel_ULPIN_Pct: sanitizeNullableNumber(row.Land_Parcel_ULPIN_Pct),
    RoR_Computerization_Pct: sanitizeNullableNumber(row.RoR_Computerization_Pct),
    Villages_CLR_Completed_Pct: sanitizeNullableNumber(row.Villages_CLR_Completed_Pct),
    Updated_Ownership_Districts_Pct: sanitizeNullableNumber(row.Updated_Ownership_Districts_Pct),
    MRR_Completion_Pct_Total: sanitizeNullableNumber(row.MRR_Completion_Pct_Total),
    Online_RoR_Download: sanitizeNullableNumber(row.Online_RoR_Download),
    Digitally_Signed_RoR: sanitizeNullableNumber(row.Digitally_Signed_RoR),
    Online_Mutation_Application: sanitizeNullableNumber(row.Online_Mutation_Application),
    Auto_Triggered_Mutation: sanitizeNullableNumber(row.Auto_Triggered_Mutation),
    Auto_Mutation: sanitizeNullableNumber(row.Auto_Mutation),
  }));

  // 5. Construct EnrichedStateData with strict assignment resolution
  const enrichedStates: EnrichedStateData[] = sanitizedStates.map((gov) => {
    const key = gov.State_UT.toUpperCase();
    const assignment = assignMap.get(key);
    if (!assignment) {
      throw new Error(`Data Integrity Error: Failed to resolve cluster assignment for "${gov.State_UT}"`);
    }

    return {
      ...gov,
      Cluster: assignment.Cluster,
      Cluster_Size: assignment.Cluster_Size,
      Cluster_Percentage: assignment.Cluster_Percentage,
    };
  });

  // Verify total count matches national scope of 36
  if (enrichedStates.length !== 36) {
    throw new Error(`Data Integrity Error: Expected 36 States/UTs, but processed ${enrichedStates.length}`);
  }

  // Sanitize cluster profiles
  const typedProfiles = rawProfiles as unknown as ClusterProfile[];
  const sanitizedProfiles: ClusterProfile[] = typedProfiles.map((p) => ({
    Cluster: p.Cluster,
    State_UT_Count: p.State_UT_Count,
    Cluster_Percentage: p.Cluster_Percentage,
    Map_Digitization_Pct: sanitizeNullableNumber(p.Map_Digitization_Pct),
    Map_GeoReferencing_Pct: sanitizeNullableNumber(p.Map_GeoReferencing_Pct),
    Map_RoR_Linkage_Pct: sanitizeNullableNumber(p.Map_RoR_Linkage_Pct),
    Land_Parcel_GeoReferencing_Pct: sanitizeNullableNumber(p.Land_Parcel_GeoReferencing_Pct),
    Land_Parcel_ULPIN_Pct: sanitizeNullableNumber(p.Land_Parcel_ULPIN_Pct),
    RoR_Computerization_Pct: sanitizeNullableNumber(p.RoR_Computerization_Pct),
    Villages_CLR_Completed_Pct: sanitizeNullableNumber(p.Villages_CLR_Completed_Pct),
    Updated_Ownership_Districts_Pct: sanitizeNullableNumber(p.Updated_Ownership_Districts_Pct),
    MRR_Completion_Pct_Total: sanitizeNullableNumber(p.MRR_Completion_Pct_Total),
    Online_RoR_Download: sanitizeNullableNumber(p.Online_RoR_Download),
    Digitally_Signed_RoR: sanitizeNullableNumber(p.Digitally_Signed_RoR),
    Online_Mutation_Application: sanitizeNullableNumber(p.Online_Mutation_Application),
    Auto_Triggered_Mutation: sanitizeNullableNumber(p.Auto_Triggered_Mutation),
  }));

  return {
    states: sanitizedStates,
    clusterAssignments: typedAssignmentRows,
    modelMetrics: rawMetrics,
    clusterProfiles: sanitizedProfiles,
    gapAnalysis: rawGaps,
    enrichedStates,
  };
}
