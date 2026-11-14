import { useState } from 'react';
import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ComparisonBarChart, ComparisonBarData } from '../components/charts/ComparisonBarChart';
import { ClusterBadge } from '../components/ui/ClusterBadge';
import {
  INDICATOR_METADATA,
  PERCENTAGE_INDICATORS,
  BINARY_INDICATORS,
  CLUSTER_CONFIG,
} from '../lib/constants';
import { toTitleCase } from '../lib/utils';
import {
  GitBranch,
  Layers,
  ArrowUpDown,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export default function ClusterIntelligence() {
  const { data, isLoading, error, reload } = useData();
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<'all' | 0 | 1>('all');
  const [sortField, setSortField] = useState<'gap' | 'name'>('gap');

  if (isLoading) {
    return <LoadingState message="Loading cluster profile intelligence..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={reload} />;
  }

  const { enrichedStates, clusterProfiles, gapAnalysis } = data;

  const c0Profile = clusterProfiles.find((p) => p.Cluster === 0);
  const c1Profile = clusterProfiles.find((p) => p.Cluster === 1);

  // Prepare chart data for percentage indicators
  const percentageChartData: ComparisonBarData[] = PERCENTAGE_INDICATORS.map((key) => {
    const meta = INDICATOR_METADATA[key];
    const c0Val = c0Profile ? (c0Profile as unknown as Record<string, number | null>)[key] ?? null : null;
    const c1Val = c1Profile ? (c1Profile as unknown as Record<string, number | null>)[key] ?? null : null;
    return {
      indicator: key,
      shortLabel: meta?.shortLabel || key,
      cluster0: c0Val,
      cluster1: c1Val,
    };
  });

  // Prepare chart data for binary service adoption indicators
  const binaryChartData: ComparisonBarData[] = BINARY_INDICATORS.map((key) => {
    const meta = INDICATOR_METADATA[key];
    const c0Val = c0Profile ? (c0Profile as unknown as Record<string, number | null>)[key] ?? null : null;
    const c1Val = c1Profile ? (c1Profile as unknown as Record<string, number | null>)[key] ?? null : null;
    return {
      indicator: key,
      shortLabel: meta?.shortLabel || key,
      cluster0: c0Val,
      cluster1: c1Val,
    };
  });

  const cluster0States = enrichedStates.filter((s) => s.Cluster === 0);
  const cluster1States = enrichedStates.filter((s) => s.Cluster === 1);

  const displayedStates =
    selectedClusterFilter === 'all'
      ? enrichedStates
      : enrichedStates.filter((s) => s.Cluster === selectedClusterFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="page-title">Cluster Intelligence & Profiles</h1>
          <p className="page-subtitle">
            Deep-dive comparative analysis of Cluster 0 vs Cluster 1 across all 13 governance indicators
          </p>
        </div>
      </div>

      {/* Cluster Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cluster 0 Card */}
        <div
          className="card border-l-4"
          style={{ borderLeftColor: CLUSTER_CONFIG[0].color }}
        >
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CLUSTER_CONFIG[0].color }}
              />
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {CLUSTER_CONFIG[0].displayName} — Foundation & Nascent Digital Infrastructure
              </h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {c0Profile?.State_UT_Count || 7} States/UTs ({Number(c0Profile?.Cluster_Percentage || 19.4).toFixed(1)}%)
            </span>
          </div>
          <div className="card-body space-y-3">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Primarily encompasses northeastern states and smaller island/special territories where cadastral mapping
              and parcel-level georeferencing face terrain, customary tenure, or legacy jurisdictional nuances.
            </p>
            <div className="pt-2 border-t border-[var(--color-border)]">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1.5">
                Member States & UTs ({cluster0States.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cluster0States.map((s) => (
                  <span
                    key={s.State_UT}
                    className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
                  >
                    {toTitleCase(s.State_UT)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cluster 1 Card */}
        <div
          className="card border-l-4"
          style={{ borderLeftColor: CLUSTER_CONFIG[1].color }}
        >
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CLUSTER_CONFIG[1].color }}
              />
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {CLUSTER_CONFIG[1].displayName} — High Digitization & Automated Services
              </h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {c1Profile?.State_UT_Count || 29} States/UTs ({Number(c1Profile?.Cluster_Percentage || 80.6).toFixed(1)}%)
            </span>
          </div>
          <div className="card-body space-y-3">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Forms the predominant national cluster covering major economic and agrarian states. Characterized by
              near-saturated text record computerization (98.8%), advanced map digitization (94.7%), and high online mutation availability (86.2%).
            </p>
            <div className="pt-2 border-t border-[var(--color-border)]">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1.5">
                Sample Member States & UTs (29 total):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cluster1States.slice(0, 10).map((s) => (
                  <span
                    key={s.State_UT}
                    className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
                  >
                    {toTitleCase(s.State_UT)}
                  </span>
                ))}
                <span className="text-xs px-2 py-0.5 text-[var(--color-text-tertiary)]">
                  +{cluster1States.length - 10} more
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Comparative Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Percentage Indicators Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center justify-between">
              <span>Cadastral & Spatial Coverage (% Means)</span>
              <span className="text-xs font-normal text-[var(--color-text-tertiary)]">9 Indicators</span>
            </h2>
          </div>
          <div className="card-body">
            <ComparisonBarChart data={percentageChartData} layout="vertical" height={360} />
          </div>
        </div>

        {/* Binary Service Adoption Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center justify-between">
              <span>Citizen Service Adoption (% Available)</span>
              <span className="text-xs font-normal text-[var(--color-text-tertiary)]">4 Indicators</span>
            </h2>
          </div>
          <div className="card-body">
            <ComparisonBarChart data={binaryChartData} layout="vertical" height={360} />
            <p className="text-xs text-[var(--color-text-tertiary)] mt-3 pt-3 border-t border-[var(--color-border)]">
              *Binary indicators represent the percentage of States/UTs in the cluster that have operationalized the digital service (100% = universally adopted across all members).
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Metric Comparison Table */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Comprehensive Cluster Means & Differential Breakdown
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Model C 13-feature space comparison derived directly from cluster profile and gap analysis datasets
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)]">Feature Indicator</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)]">Category</th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">
                  {CLUSTER_CONFIG[0].displayName} Mean
                </th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">
                  {CLUSTER_CONFIG[1].displayName} Mean
                </th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">
                  Difference (C1 - C0)
                </th>
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">
                  Absolute Gap
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {gapAnalysis.map((row) => {
                const meta = INDICATOR_METADATA[row.Feature];
                const isPositive = row.Difference_C1_minus_C0 >= 0;
                return (
                  <tr key={row.Feature} className="hover:bg-[var(--color-surface-tertiary)]/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">
                      {meta?.label || row.Feature}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                        {row.Category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {row.Cluster_0_Mean.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {row.Cluster_1_Mean.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium">
                      <span className={isPositive ? 'text-emerald-600' : 'text-amber-600'}>
                        {isPositive ? '+' : ''}
                        {row.Difference_C1_minus_C0.toFixed(1)} pp
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                      {row.Absolute_Gap.toFixed(1)} pp
                    </td>
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
