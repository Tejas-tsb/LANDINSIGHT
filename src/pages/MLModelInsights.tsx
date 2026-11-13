import { useState, useMemo } from 'react';
import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { StatCard } from '../components/ui/StatCard';
import {
  MODEL_DESCRIPTIONS,
  SELECTED_MODEL,
  SELECTED_K,
  ASSET_PATHS,
} from '../lib/constants';
import {
  Brain,
  Layers,
  CheckCircle,
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
  const [selectedModelFilter, setSelectedModelFilter] = useState<'All' | 'Model A' | 'Model B' | 'Model C'>('All');

  if (isLoading) {
    return <LoadingState message="Loading ML model evaluation metrics..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={reload} />;
  }

  const { modelMetrics } = data;

  // Selected config
  const selectedConfig = modelMetrics.find(
    (m) => m.Model === SELECTED_MODEL && m.K === SELECTED_K
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="page-title">Unsupervised ML Model Insights</h1>
          <p className="page-subtitle">
            Feature engineering, hyperparameter evaluation across K=2..6, and PCA 2D projection analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle size={14} />
            Selected: {SELECTED_MODEL} (K={SELECTED_K})
          </span>
        </div>
      </div>

      {/* Selected Model Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Selected Model"
          value={SELECTED_MODEL}
          subtitle="Rare feature sensitivity (13 features)"
          icon={<Brain size={20} className="text-blue-600" />}
        />
        <StatCard
          label="Optimal K"
          value={`K = ${SELECTED_K}`}
          subtitle="Binary partition (2 clusters)"
          icon={<Layers size={20} className="text-blue-600" />}
        />
        <StatCard
          label="Silhouette Score"
          value={selectedConfig ? selectedConfig.Silhouette_Score.toFixed(4) : '0.4076'}
          subtitle="Mean silhouette coefficient: (b - a) / max(a, b)"
          icon={<Activity size={20} className="text-emerald-600" />}
        />
        <StatCard
          label="Davies-Bouldin Index"
          value={selectedConfig ? selectedConfig.Davies_Bouldin_Index.toFixed(4) : '1.1524'}
          subtitle="Cluster scatter-to-separation ratio (lower is superior)"
          icon={<TrendingDown size={20} className="text-emerald-600" />}
        />
        <StatCard
          label="Stability (Mean ARI)"
          value={selectedConfig ? selectedConfig.Mean_ARI.toFixed(4) : '1.0000'}
          subtitle="Zero variance (Std = 0.0000)"
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
            const isSelected = key === SELECTED_MODEL;
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
              <p className="text-xs text-[var(--color-text-secondary)]">Higher score indicates superior cluster cohesion and separation</p>
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
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" />
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
              <p className="text-xs text-[var(--color-text-secondary)]">Lower score indicates tighter, better-separated clusters</p>
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
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" />
                  <Line type="monotone" dataKey="ModelA_DBI" name="Model A (14)" stroke="#94A3B8" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="ModelB_DBI" name="Model B (12)" stroke="#D97706" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="ModelC_DBI" name="Model C (13)" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

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
          <div className="lg:col-span-8 rounded-lg overflow-hidden border border-[var(--color-border)] bg-white p-2">
            <img
              src={ASSET_PATHS.pcaVisualization}
              alt="PCA Cluster Visualization of Digital Land Governance"
              className="w-full h-auto object-contain rounded"
            />
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
                K-Means clustering was executed in the <strong>full 13-dimensional standardized space</strong>, NOT in this 2D PCA plane.
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
            Full Model Evaluation Matrix (15 Experimental Runs)
          </h2>
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
                const isSelected = row.Model === SELECTED_MODEL && row.K === SELECTED_K;
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
