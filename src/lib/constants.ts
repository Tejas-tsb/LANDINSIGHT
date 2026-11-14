// =============================================================================
// Application constants — feature lists, indicator metadata, color mappings
// =============================================================================

/** Indicator metadata for display */
export interface IndicatorMeta {
  key: string;
  label: string;
  shortLabel: string;
  category: 'percentage' | 'binary';
  description: string;
  unit: string;
}

/**
 * All 14 candidate clustering features (Model A baseline).
 * State_UT, Total_Districts, Total_Villages are excluded from clustering.
 */
export const ALL_CLUSTERING_FEATURES: string[] = [
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
];

/**
 * Model C features (13) — excludes Auto_Mutation.
 * This is the selected model configuration.
 */
export const MODEL_C_FEATURES: string[] = ALL_CLUSTERING_FEATURES.filter(
  (f) => f !== 'Auto_Mutation'
);

/** Model B features (12) — removes correlated pair members */
export const MODEL_B_FEATURES: string[] = ALL_CLUSTERING_FEATURES.filter(
  (f) => f !== 'Villages_CLR_Completed_Pct' && f !== 'Land_Parcel_ULPIN_Pct'
);

/** Percentage coverage indicators */
export const PERCENTAGE_INDICATORS: string[] = [
  'Map_Digitization_Pct',
  'Map_GeoReferencing_Pct',
  'Map_RoR_Linkage_Pct',
  'Land_Parcel_GeoReferencing_Pct',
  'Land_Parcel_ULPIN_Pct',
  'RoR_Computerization_Pct',
  'Villages_CLR_Completed_Pct',
  'Updated_Ownership_Districts_Pct',
  'MRR_Completion_Pct_Total',
];

/** Binary service adoption indicators (used in Model C) */
export const BINARY_INDICATORS: string[] = [
  'Online_RoR_Download',
  'Digitally_Signed_RoR',
  'Online_Mutation_Application',
  'Auto_Triggered_Mutation',
];

/** Full indicator metadata for all 13 Model C features */
export const INDICATOR_METADATA: Record<string, IndicatorMeta> = {
  Map_Digitization_Pct: {
    key: 'Map_Digitization_Pct',
    label: 'Map Digitization',
    shortLabel: 'Map Digitization',
    category: 'percentage',
    description: 'Percentage of cadastral maps digitized',
    unit: '%',
  },
  Map_GeoReferencing_Pct: {
    key: 'Map_GeoReferencing_Pct',
    label: 'Map Geo-Referencing',
    shortLabel: 'Geo-Referencing',
    category: 'percentage',
    description: 'Percentage of cadastral maps geo-referenced',
    unit: '%',
  },
  Map_RoR_Linkage_Pct: {
    key: 'Map_RoR_Linkage_Pct',
    label: 'Map–RoR Linkage',
    shortLabel: 'RoR Linkage',
    category: 'percentage',
    description: 'Percentage of maps linked to Record of Rights',
    unit: '%',
  },
  Land_Parcel_GeoReferencing_Pct: {
    key: 'Land_Parcel_GeoReferencing_Pct',
    label: 'Land Parcel Geo-Referencing',
    shortLabel: 'Parcel Geo-Ref',
    category: 'percentage',
    description: 'Percentage of land parcels geo-referenced',
    unit: '%',
  },
  Land_Parcel_ULPIN_Pct: {
    key: 'Land_Parcel_ULPIN_Pct',
    label: 'Land Parcel ULPIN',
    shortLabel: 'ULPIN',
    category: 'percentage',
    description: 'Percentage of land parcels assigned Unique Land Parcel Identification Number',
    unit: '%',
  },
  RoR_Computerization_Pct: {
    key: 'RoR_Computerization_Pct',
    label: 'RoR Computerization',
    shortLabel: 'RoR Comp.',
    category: 'percentage',
    description: 'Percentage of Record of Rights computerized',
    unit: '%',
  },
  Villages_CLR_Completed_Pct: {
    key: 'Villages_CLR_Completed_Pct',
    label: 'CLR Completion (Villages)',
    shortLabel: 'CLR Villages',
    category: 'percentage',
    description: 'Percentage of villages with Computerization of Land Records completed',
    unit: '%',
  },
  Updated_Ownership_Districts_Pct: {
    key: 'Updated_Ownership_Districts_Pct',
    label: 'Updated Ownership (Districts)',
    shortLabel: 'Ownership Update',
    category: 'percentage',
    description: 'Percentage of districts with updated ownership records',
    unit: '%',
  },
  MRR_Completion_Pct_Total: {
    key: 'MRR_Completion_Pct_Total',
    label: 'Modern Record Room Completion',
    shortLabel: 'MRR Completion',
    category: 'percentage',
    description: 'Percentage of Modern Record Room setup completed',
    unit: '%',
  },
  Online_RoR_Download: {
    key: 'Online_RoR_Download',
    label: 'Online RoR Download',
    shortLabel: 'RoR Download',
    category: 'binary',
    description: 'Whether online Record of Rights download is available',
    unit: 'Yes/No',
  },
  Digitally_Signed_RoR: {
    key: 'Digitally_Signed_RoR',
    label: 'Digitally Signed RoR',
    shortLabel: 'Signed RoR',
    category: 'binary',
    description: 'Whether digitally signed Record of Rights is available',
    unit: 'Yes/No',
  },
  Online_Mutation_Application: {
    key: 'Online_Mutation_Application',
    label: 'Online Mutation Application',
    shortLabel: 'Online Mutation',
    category: 'binary',
    description: 'Whether online mutation application facility is available',
    unit: 'Yes/No',
  },
  Auto_Triggered_Mutation: {
    key: 'Auto_Triggered_Mutation',
    label: 'Auto-Triggered Mutation',
    shortLabel: 'Auto Mutation',
    category: 'binary',
    description: 'Whether auto-triggered mutation on registration is available',
    unit: 'Yes/No',
  },
};

/** Cluster display configuration */
export const CLUSTER_CONFIG = {
  0: {
    label: 'Cluster 0',
    displayName: 'Cluster 0',
    color: '#4A7FB5',
    lightColor: '#6B9FD4',
    bgColor: '#EBF2FA',
    bgColorDark: '#1A2E44',
  },
  1: {
    label: 'Cluster 1',
    displayName: 'Cluster 1',
    color: '#D4A03C',
    lightColor: '#E4B85C',
    bgColor: '#FDF6E8',
    bgColorDark: '#3D3118',
  },
} as const;

/** Model descriptions */
export const MODEL_DESCRIPTIONS: Record<string, { name: string; label: string; description: string; featureCount: number }> = {
  'Model A': {
    name: 'Model A',
    label: 'Baseline',
    description: 'All 14 governance indicators',
    featureCount: 14,
  },
  'Model B': {
    name: 'Model B',
    label: 'Correlation Reduced',
    description: 'Removed Villages_CLR_Completed_Pct and Land_Parcel_ULPIN_Pct (correlated pairs)',
    featureCount: 12,
  },
  'Model C': {
    name: 'Model C',
    label: 'Rare Feature Sensitivity',
    description: 'Removed Auto_Mutation (rare binary feature)',
    featureCount: 13,
  },
};

/** Selected model configuration */
export const SELECTED_MODEL = 'Model C';
export const SELECTED_K = 2;

/** Unified tooltip properties for Recharts across light and dark themes */
export const RECHARTS_TOOLTIP_PROPS = {
  contentStyle: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
    color: 'var(--color-text-primary)',
    fontSize: '0.75rem',
    padding: '8px 12px',
  },
  itemStyle: {
    color: 'var(--color-text-primary)',
    fontSize: '0.75rem',
    padding: '2px 0',
  },
  labelStyle: {
    color: 'var(--color-text-primary)',
    fontWeight: 600,
    fontSize: '0.75rem',
    marginBottom: '4px',
  },
  cursor: false,
} as const;

/** CSV file paths */
export const DATA_PATHS = {
  governance: '/data/Cleaned_Digital_Land_Governance.csv',
  clusterAssignments: '/data/Final_State_UT_Cluster_Assignments.csv',
  modelMetrics: '/data/Final_Model_Evaluation_Metrics.csv',
  clusterProfiles: '/data/Final_Cluster_Profiles.csv',
  gapAnalysis: '/data/Cluster_Gap_Analysis.csv',
};

/** Asset file paths */
export const ASSET_PATHS = {
  pcaVisualization: '/assets/PCA_Cluster_Visualization.png',
  governanceHeatmap: '/assets/Governance_Indicator_Heatmap.png',
  binaryAdoptionHeatmap: '/assets/Binary_Service_Adoption_Heatmap.png',
};

/** Navigation items */
export const NAV_ITEMS = [
  { path: '/', label: 'Executive Overview', icon: 'LayoutDashboard' },
  { path: '/map', label: 'Governance Map', icon: 'Map' },
  { path: '/explorer', label: 'State/UT Explorer', icon: 'Search' },
  { path: '/clusters', label: 'Cluster Intelligence', icon: 'GitBranch' },
  { path: '/indicators', label: 'Indicator Analytics', icon: 'BarChart3' },
  { path: '/comparison', label: 'State Comparison', icon: 'GitCompareArrows' },
  { path: '/gaps', label: 'Gap Analysis', icon: 'TrendingUp' },
  { path: '/models', label: 'ML Model Insights', icon: 'Brain' },
  { path: '/reports', label: 'Reports & Downloads', icon: 'FileDown' },
] as const;
