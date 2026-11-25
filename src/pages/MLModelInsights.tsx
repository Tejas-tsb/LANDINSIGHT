import { useState, useMemo } from 'react';
import { useData } from '../lib/dataContext';
import { useSelectedClusterData } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { StatCard } from '../components/ui/StatCard';
import {
  MODEL_DESCRIPTIONS,
  ASSET_PATHS,
  RECHARTS_TOOLTIP_PROPS,
} from '../lib/constants';
import {
  HelpCircle,
  TrendingDown,
  Activity,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function MLModelInsights() {
  const { data, isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();
  const [selectedModelFilter, setSelectedModelFilter] = useState<'All' | 'Model A' | 'Model B' | 'Model C'>('All');

  const baseModelMetrics = data?.modelMetrics ?? [];

  // Selected configuration metrics are sourced from the verified Phase 5 JSON.
  const selectedConfig = selected.config;
  const modelMetrics = selectedConfig ? (() => {
    const selectedRow = { Model: selectedConfig.model, Feature_Count: selectedConfig.featureCount, K: selectedConfig.k, WCSS: selectedConfig.wcss, Silhouette_Score: selectedConfig.silhouetteScore, Davies_Bouldin_Index: selectedConfig.daviesBouldinIndex, Mean_ARI: selectedConfig.meanARI, Std_ARI: selectedConfig.stdARI };
    const matchingIndex = baseModelMetrics.findIndex((row) => row.Model === selectedConfig.model && row.K === selectedConfig.k);
    if (matchingIndex < 0) return [...baseModelMetrics, selectedRow];
    return baseModelMetrics.map((row, index) => index === matchingIndex ? selectedRow : row);
  })() : baseModelMetrics;

  // Prepare line chart data comparing K vs Silhouette across Models
  const kComparisonData = useMemo(() => {
    const kValues = [2, 3, 4, 5, 6];
    return kValues.map((k) => {
      const mA = modelMetrics.find((m) => m.Model === 'Model A' && m.K === k);
      const mB = modelMetrics.find((m) => m.Model === 'Model B' && m.K === k);
      const mC = modelMetrics.find((m) => m.Model === 'Model C' && m.K === k);
      return {
        k: `K=${k}`,
        ModelA_Sil: mA ? Number(mA.Silhouette_Score.toFixed(4)) : null,
        ModelB_Sil: mB ? Number(mB.Silhouette_Score.toFixed(4)) : null,
        ModelC_Sil: mC ? Number(mC.Silhouette_Score.toFixed(4)) : null,
        ModelA_DBI: mA ? Number(mA.Davies_Bouldin_Index.toFixed(4)) : null,
        ModelB_DBI: mB ? Number(mB.Davies_Bouldin_Index.toFixed(4)) : null,
        ModelC_DBI: mC ? Number(mC.Davies_Bouldin_Index.toFixed(4)) : null,
        ModelA_WCSS: mA ? Number(mA.WCSS.toFixed(1)) : null,
        ModelB_WCSS: mB ? Number(mB.WCSS.toFixed(1)) : null,
        ModelC_WCSS: mC ? Number(mC.WCSS.toFixed(1)) : null,
      };
    });
  }, [modelMetrics]);

  if (isLoading || selected.isExplorerLoading) {
    return <LoadingState message="Loading ML model evaluation metrics..." />;
  }

  if (error || selected.explorerError || !data || !selectedConfig) {
    return <ErrorState message={error || selected.explorerError || 'Failed to load data.'} onRetry={reload} />;
  }

  return (
    <div className="space-y-6">
      {/* Selected Model Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Silhouette Score"
          value={selectedConfig.silhouetteScore.toFixed(4)}
          subtitle="Mean silhouette coefficient: (b - a) / max(a, b)"
          icon={<Activity size={20} className="text-emerald-600" />}
        />
        <StatCard
          label="Davies-Bouldin Index"
          value={selectedConfig.daviesBouldinIndex.toFixed(4)}
          subtitle="Lower can indicate tighter, better-separated groups in this analysis"
          icon={<TrendingDown size={20} className="text-emerald-600" />}
        />
        <StatCard
          label="WCSS"
          value={selectedConfig.wcss.toFixed(2)}
          subtitle="Within-cluster sum of squares"
          icon={<Activity size={20} className="text-blue-600" />}
        />
        <StatCard
          label="Mean ARI"
          value={selectedConfig.meanARI.toFixed(4)}
          subtitle="Mean pairwise adjusted Rand index"
          icon={<ShieldCheck size={20} className="text-blue-600" />}
        />
        <StatCard
          label="Std ARI"
          value={selectedConfig.stdARI.toFixed(4)}
          subtitle="Stability variation across seeds"
          icon={<ShieldCheck size={20} className="text-blue-600" />}
        />
      </div>

      {/* Feature Selection Comparison Grid */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Feature Selection & Model Architectures Evaluated
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
          {Object.entries(MODEL_DESCRIPTIONS).map(([key, desc]) => {
            const isSelected = key === selectedConfig.model;
            return (
              <div
                key={key}
                className={`p-5 space-y-2.5 transition-colors ${
                  isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">
                    {desc.name} — {desc.label}
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {desc.description}
                </p>
                <div className="pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)] flex justify-between">
                  <span>Input Dimensionality:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {desc.featureCount} Features
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation Curves (Silhouette & Davies-Bouldin across K) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Silhouette Score Curve */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Silhouette Score Trajectory (K = 2..6)
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Higher values indicate better separation for this partition; they do not establish a universally best model.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kComparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="k" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <YAxis domain={[0.2, 0.45]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <Tooltip
                    {...RECHARTS_TOOLTIP_PROPS}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px' }} />
                  <Line type="monotone" dataKey="ModelA_Sil" name="Model A (14)" stroke="#94A3B8" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="ModelB_Sil" name="Model B (12)" stroke="#D97706" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="ModelC_Sil" name="Model C (13)" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Davies-Bouldin Index Curve */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Davies-Bouldin Index Trajectory (K = 2..6)
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Lower values indicate tighter, better-separated groups within a comparable feature space.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kComparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="k" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <YAxis domain={[0.9, 1.7]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <Tooltip
                    {...RECHARTS_TOOLTIP_PROPS}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px' }} />
                  <Line type="monotone" dataKey="ModelA_DBI" name="Model A (14)" stroke="#94A3B8" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="ModelB_DBI" name="Model B (12)" stroke="#D97706" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="ModelC_DBI" name="Model C (13)" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Silhouette, Davies-Bouldin, WCSS, and ARI describe different aspects of the clustering results. They depend on K, feature selection,
        and the tested data, so no single metric establishes a universally superior configuration.
      </p>

      {/* PCA Projection Visualization and Analytical Notice */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Principal Component Analysis (PCA) 2D Projection
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Visualization of 36 States/UTs in the primary 2D projection space (PC1: 48.29%, PC2: 10.92% explained variance)
          </p>
        </div>
        <div className="card-body grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* PCA Image Asset */}
          <div className="lg:col-span-8 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3 shadow-inner flex flex-col items-center">
            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 mb-2 border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">Baseline projection · Model C (K=2)</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span>Cluster 0 (7)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span>Cluster 1 (29)</span>
                </span>
              </div>
            </div>
            <div className="w-full bg-[var(--color-surface-secondary)] rounded border border-[var(--color-border)] p-1.5 flex justify-center">
              <img
                src={ASSET_PATHS.pcaVisualization}
                alt="PCA Cluster Visualization of Digital Land Governance"
                className="w-full h-auto max-h-[480px] object-contain rounded brightness-[0.96] contrast-[1.04]"
              />
            </div>
          </div>

          {/* Technical Explanation Sidebar */}
          <div className="lg:col-span-4 space-y-3 text-xs leading-relaxed">
            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">
                Dimensionality Reduction Details
              </h4>
              <p className="text-[var(--color-text-secondary)]">
                <strong>PC1 (48.29% variance):</strong> Captures overall cadastral modernization, parcel georeferencing, and RoR digital availability.
              </p>
              <p className="text-[var(--color-text-secondary)] mt-1">
                <strong>PC2 (10.92% variance):</strong> Captures secondary variation in ownership record updates and local mutation pipelines.
              </p>
              <p className="text-[var(--color-text-tertiary)] mt-1.5 font-mono">
                Total 2D Explained Variance: 59.21%
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[var(--color-text-secondary)]">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                <HelpCircle size={14} /> Critical Mathematical Distinctions
              </h4>
              <p>
                This figure shows the baseline Model C (K=2) assignments projected into two dimensions. K-Means clustering was executed in the <strong>full 13-dimensional standardized space</strong>, not in this PCA plane.
              </p>
              <p className="mt-1">
                The PCA plot serves as an orthogonal visual projection to verify cluster separability; apparent proximity in 2D does not reflect the total 13-dimensional Euclidean distance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Evaluation Metrics Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Model Evaluation Matrix (15 model/K records)
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            The preserved notebook evaluates 15 Model/K records (K=2–6); K=7 and K=8 results are absent from the available artifacts. The dashboard uses Model C (K=2) and Model B (K=3, 4, 5). K-Means groups observed patterns; it does not predict outcomes or assign official rankings.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)]">Model</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-center">Features</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-center">K</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">WCSS</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">Silhouette Score</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">Davies-Bouldin</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">Mean ARI</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">Std ARI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {modelMetrics.map((row, idx) => {
                const isSelected = row.Model === selectedConfig.model && row.K === selectedConfig.k;
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 font-semibold text-blue-700 dark:text-blue-300'
                        : 'hover:bg-[var(--color-surface-tertiary)]/50 text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <td className="py-2 px-4 flex items-center gap-2">
                      {row.Model}
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-600 text-white font-bold">
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center font-mono">{row.Feature_Count}</td>
                    <td className="py-2 px-4 text-center font-mono font-bold">{row.K}</td>
                    <td className="py-2 px-4 text-right font-mono">{row.WCSS.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right font-mono font-bold">
                      {row.Silhouette_Score.toFixed(4)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {row.Davies_Bouldin_Index.toFixed(4)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">{row.Mean_ARI.toFixed(4)}</td>
                    <td className="py-2 px-4 text-right font-mono">{row.Std_ARI.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
