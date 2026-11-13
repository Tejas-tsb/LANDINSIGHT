import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  DATA_PATHS,
  ASSET_PATHS,
  SELECTED_MODEL,
  SELECTED_K,
} from '../lib/constants';
import {
  FileDown,
  FileSpreadsheet,
  Image,
  MapPin,
  CheckCircle,
  ExternalLink,
  Download,
  BookOpen,
} from 'lucide-react';

export default function ReportsDownloads() {
  const { data, isLoading, error, reload } = useData();

  if (isLoading) {
    return <LoadingState message="Loading download repository..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={reload} />;
  }

  const csvFiles = [
    {
      name: 'Cleaned_Digital_Land_Governance.csv',
      path: DATA_PATHS.governance,
      description: 'Master cleaned dataset containing all 17 administrative & digital indicators across 36 States/UTs.',
      size: '36 rows × 17 columns',
      format: 'CSV (Comma Separated)',
    },
    {
      name: 'Final_State_UT_Cluster_Assignments.csv',
      path: DATA_PATHS.clusterAssignments,
      description: 'Final cluster labels assigned by Model C (K=2) K-Means algorithm with cluster sizes & percentages.',
      size: '36 rows × 6 columns',
      format: 'CSV (Comma Separated)',
    },
    {
      name: 'Final_Model_Evaluation_Metrics.csv',
      path: DATA_PATHS.modelMetrics,
      description: 'Full evaluation benchmark across Models A, B, and C for K=2..6 (WCSS, Silhouette, DBI, ARI stability).',
      size: '15 rows × 8 columns',
      format: 'CSV (Comma Separated)',
    },
    {
      name: 'Final_Cluster_Profiles.csv',
      path: DATA_PATHS.clusterProfiles,
      description: 'Descriptive mean profiles for Cluster 0 and Cluster 1 across all 13 Model C features.',
      size: '2 rows × 16 columns',
      format: 'CSV (Comma Separated)',
    },
    {
      name: 'Cluster_Gap_Analysis.csv',
      path: DATA_PATHS.gapAnalysis,
      description: 'Ranked absolute gaps between Cluster 0 and Cluster 1 means with category annotations.',
      size: '13 rows × 7 columns',
      format: 'CSV (Comma Separated)',
    },
  ];

  const visualAssets = [
    {
      name: 'PCA_Cluster_Visualization.png',
      path: ASSET_PATHS.pcaVisualization,
      description: 'High-resolution scatter plot of 36 States and UTs projected onto PC1 & PC2 with cluster coloring.',
      dimensions: '2D PCA Projection (59.21% Variance)',
    },
    {
      name: 'Governance_Indicator_Heatmap.png',
      path: ASSET_PATHS.governanceHeatmap,
      description: 'Sorted matrix heatmap visualizing 9 percentage coverage indicators across all States and UTs.',
      dimensions: 'Cadastral Coverage Heatmap',
    },
    {
      name: 'Binary_Service_Adoption_Heatmap.png',
      path: ASSET_PATHS.binaryAdoptionHeatmap,
      description: 'Adoption availability matrix for the 4 digital citizen service indicators across all States and UTs.',
      dimensions: 'Digital Services Heatmap',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="page-title">Reports, Datasets & Visual Exports</h1>
          <p className="page-subtitle">
            Download raw CSV datasets, analytical matrices, high-resolution figures, and authentic spatial boundaries.
          </p>
        </div>
      </div>

      {/* Model Summary & Academic Metadata Banner */}
      <div className="card p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200 dark:border-blue-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              Project Specification & Model Provenance
            </span>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              LANDINSIGHT — Digital Land Governance Intelligence Platform
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-2xl">
              Academic unsupervised machine learning project evaluating digital land records progress across 36 Indian States and UTs using DILRMP administrative datasets.
            </p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <span className="block text-[var(--color-text-tertiary)]">Selected Model:</span>
            <span className="font-bold text-blue-600 font-mono">{SELECTED_MODEL} (K={SELECTED_K})</span>
            <span className="block text-[11px] text-[var(--color-text-secondary)]">Silhouette: 0.4076 · DBI: 1.1524</span>
          </div>
        </div>
      </div>

      {/* Section 1: CSV Datasets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-emerald-600" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Primary CSV Datasets & Analytical Outputs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {csvFiles.map((file) => (
            <div key={file.name} className="card flex flex-col justify-between p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold font-mono text-[var(--color-text-primary)] break-all">
                    {file.name}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] flex-shrink-0">
                    CSV
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {file.description}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] font-mono">
                  {file.size}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
                <a
                  href={file.path}
                  download={file.name}
                  className="w-full btn-secondary justify-center text-xs py-1.5"
                >
                  <Download size={13} />
                  Download CSV
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Visualizations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Image size={18} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            High-Resolution Analytical Figures
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visualAssets.map((asset) => (
            <div key={asset.name} className="card flex flex-col justify-between p-4">
              <div className="space-y-2">
                <div className="h-32 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden border border-[var(--color-border)] flex items-center justify-center">
                  <img
                    src={asset.path}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xs font-bold font-mono text-[var(--color-text-primary)]">
                  {asset.name}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {asset.description}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">
                  {asset.dimensions}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
                <a
                  href={asset.path}
                  download={asset.name}
                  className="w-full btn-secondary justify-center text-xs py-1.5"
                >
                  <Download size={13} />
                  Download Image
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Spatial Boundary GeoJSON */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-amber-600" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Geospatial Boundary Data
          </h2>
        </div>

        <div className="card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold font-mono text-[var(--color-text-primary)]">
                india_states.geojson
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Authentic State and Union Territory polygonal boundary coordinates for choropleth mapping across all 36 Indian administrative entities.
              </p>
            </div>
            <a
              href="/data/india_states.geojson"
              download="india_states.geojson"
              className="btn-secondary text-xs flex-shrink-0"
            >
              <Download size={14} />
              Download GeoJSON (1.0 MB)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
