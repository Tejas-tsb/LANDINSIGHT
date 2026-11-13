// =============================================================================
// TypeScript interfaces for all LANDINSIGHT datasets
// =============================================================================

/** Raw row from Cleaned_Digital_Land_Governance.csv */
export interface StateGovernanceData {
  State_UT: string;
  Total_Districts: number | null;
  Total_Villages: number | null;
  // Percentage coverage indicators (0–100 or null if unavailable)
  Map_Digitization_Pct: number | null;
  Map_GeoReferencing_Pct: number | null;
  Map_RoR_Linkage_Pct: number | null;
  Land_Parcel_GeoReferencing_Pct: number | null;
  Land_Parcel_ULPIN_Pct: number | null;
  RoR_Computerization_Pct: number | null;
  Villages_CLR_Completed_Pct: number | null;
  Updated_Ownership_Districts_Pct: number | null;
  MRR_Completion_Pct_Total: number | null;
  // Binary service adoption indicators (0, 1, or null if unavailable)
  Online_RoR_Download: number | null;
  Digitally_Signed_RoR: number | null;
  Online_Mutation_Application: number | null;
  Auto_Triggered_Mutation: number | null;
  Auto_Mutation: number | null;
}

/** Row from Final_State_UT_Cluster_Assignments.csv */
export interface ClusterAssignment {
  State_UT: string;
  Cluster: number;
  Cluster_Size: number;
  Cluster_Percentage: number;
  Model: string;
  K: number;
}

/** Row from Final_Model_Evaluation_Metrics.csv */
export interface ModelEvaluationMetric {
  Model: string;
  Feature_Count: number;
  K: number;
  WCSS: number;
  Silhouette_Score: number;
  Davies_Bouldin_Index: number;
  Mean_ARI: number;
  Std_ARI: number;
}

/** Row from Final_Cluster_Profiles.csv */
export interface ClusterProfile {
  Cluster: number;
  State_UT_Count: number;
  Cluster_Percentage: number;
  // Mean values for 13 indicators (Model C features)
  Map_Digitization_Pct: number | null;
  Map_GeoReferencing_Pct: number | null;
  Map_RoR_Linkage_Pct: number | null;
  Land_Parcel_GeoReferencing_Pct: number | null;
  Land_Parcel_ULPIN_Pct: number | null;
  RoR_Computerization_Pct: number | null;
  Villages_CLR_Completed_Pct: number | null;
  Updated_Ownership_Districts_Pct: number | null;
  MRR_Completion_Pct_Total: number | null;
  Online_RoR_Download: number | null;
  Digitally_Signed_RoR: number | null;
  Online_Mutation_Application: number | null;
  Auto_Triggered_Mutation: number | null;
}

/** Row from Cluster_Gap_Analysis.csv */
export interface GapAnalysisEntry {
  Gap_Rank: number;
  Feature: string;
  Category: string;
  Cluster_0_Mean: number;
  Cluster_1_Mean: number;
  Difference_C1_minus_C0: number;
  Absolute_Gap: number;
}

/** Enriched state data: governance data merged with cluster assignment */
export interface EnrichedStateData extends StateGovernanceData {
  Cluster: number;
  Cluster_Size: number;
  Cluster_Percentage: number;
}

/** All loaded application data */
export interface AppData {
  states: StateGovernanceData[];
  clusterAssignments: ClusterAssignment[];
  modelMetrics: ModelEvaluationMetric[];
  clusterProfiles: ClusterProfile[];
  gapAnalysis: GapAnalysisEntry[];
  enrichedStates: EnrichedStateData[];
}
