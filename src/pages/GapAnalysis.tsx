import { useState, useMemo } from 'react';
import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  INDICATOR_METADATA,
  CLUSTER_CONFIG,
  RECHARTS_TOOLTIP_PROPS,
} from '../lib/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function GapAnalysis() {
  const { data, isLoading, error, reload } = useData();
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Percentage Coverage' | 'Binary Adoption'>('all');

  const gapAnalysis = data?.gapAnalysis ?? [];

  const filteredGaps = useMemo(() => {
    if (categoryFilter === 'all') return gapAnalysis;
    return gapAnalysis.filter((row) => row.Category === categoryFilter);
  }, [gapAnalysis, categoryFilter]);

  // Chart data sorted by Absolute Gap descending
  const chartData = useMemo(() => {
    return [...filteredGaps]
      .sort((a, b) => b.Absolute_Gap - a.Absolute_Gap)
      .map((row) => {
        const meta = INDICATOR_METADATA[row.Feature];
        return {
          feature: row.Feature,
          label: meta?.shortLabel || row.Feature,
          fullLabel: meta?.label || row.Feature,
          gap: Number(row.Absolute_Gap.toFixed(1)),
          c0Mean: Number(row.Cluster_0_Mean.toFixed(1)),
          c1Mean: Number(row.Cluster_1_Mean.toFixed(1)),
          diff: Number(row.Difference_C1_minus_C0.toFixed(1)),
          category: row.Category,
        };
      });
  }, [filteredGaps]);

  if (isLoading) {
    return <LoadingState message="Loading governance gap analysis..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={reload} />;
  }

  const topGap = chartData[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="page-title">Digital Governance Gap Analysis</h1>
          <p className="page-subtitle">
            Ranked empirical divergence between Cluster 0 and Cluster 1 across 13 governance indicators.
          </p>
        </div>
      </div>

      {/* Explanatory Guardrail Callout */}
      <div className="p-4 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
        <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
          <p className="font-semibold text-[var(--color-text-primary)]">
            Analytical Interpretation Notice: Descriptive Gaps, Not Causal Deficits
          </p>
          <p className="leading-relaxed">
            The gaps reported below represent observed differences in cluster centroids calculated in the standardized 13-feature space.
            They indicate institutional and structural variation in digital adoption, not administrative inadequacy.
            Binary adoption indicators represent difference in percentage availability across cluster members.
          </p>
        </div>
      </div>

      {/* Top Gap Insight Card */}
      {topGap && (
        <div className="card border-l-4 border-l-blue-600 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Rank #1 Observed Divergence
              </span>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mt-0.5">
                {topGap.fullLabel} ({topGap.category})
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Cluster 1 leads Cluster 0 by an absolute gap of{' '}
                <strong className="text-blue-600 font-mono">{topGap.gap} pp</strong> (Cluster 1:{' '}
                {topGap.c1Mean}% vs Cluster 0: {topGap.c0Mean}%).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center p-3 rounded-lg bg-[var(--color-surface-secondary)] min-w-[100px]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] block">Cluster 0 Mean</span>
                <span className="text-sm font-bold font-mono text-[var(--color-text-primary)]">
                  {topGap.c0Mean}%
                </span>
              </div>
              <ArrowRight size={16} className="text-[var(--color-text-tertiary)]" />
              <div className="text-center p-3 rounded-lg bg-[var(--color-surface-secondary)] min-w-[100px]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] block">Cluster 1 Mean</span>
                <span className="text-sm font-bold font-mono text-blue-600">
                  {topGap.c1Mean}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Visual Gap Ranking Chart */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Ranked Absolute Gap (Cluster 1 Mean − Cluster 0 Mean)
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Magnitude of difference in percentage points between cluster means
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-[var(--color-text-tertiary)]" />
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 text-xs rounded font-medium ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              All (13)
            </button>
            <button
              onClick={() => setCategoryFilter('Binary Adoption')}
              className={`px-2.5 py-1 text-xs rounded font-medium ${
                categoryFilter === 'Binary Adoption'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              Binary Adoption (4)
            </button>
            <button
              onClick={() => setCategoryFilter('Percentage Coverage')}
              className={`px-2.5 py-1 text-xs rounded font-medium ${
                categoryFilter === 'Percentage Coverage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              Percentage Coverage (9)
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="w-full h-88">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 110, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 90]}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  tickFormatter={(v) => `${v} pp`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: 'var(--color-text-primary)', fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value: unknown, _name: unknown, entry: { payload?: { c0Mean: number; c1Mean: number; category: string } }) => {
                    const p = entry.payload;
                    return [
                      `${value} pp gap (C1: ${p?.c1Mean}% vs C0: ${p?.c0Mean}%)`,
                      `Category: ${p?.category}`,
                    ];
                  }}
                  {...RECHARTS_TOOLTIP_PROPS}
                />
                <Bar dataKey="gap" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.category === 'Binary Adoption' ? '#2563EB' : '#4A7FB5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Complete Gap Ranking Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Full Gap Analysis Matrix
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)]">Rank</th>
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
              {filteredGaps.map((row) => {
                const meta = INDICATOR_METADATA[row.Feature];
                return (
                  <tr key={row.Feature} className="hover:bg-[var(--color-surface-tertiary)]/50">
                    <td className="py-2.5 px-4 font-bold text-blue-600 font-mono">
                      #{row.Gap_Rank}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">
                      {meta?.label || row.Feature}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                        {row.Category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {row.Cluster_0_Mean.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {row.Cluster_1_Mean.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium">
                      <span className={row.Difference_C1_minus_C0 >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                        {row.Difference_C1_minus_C0 >= 0 ? '+' : ''}
                        {row.Difference_C1_minus_C0.toFixed(2)} pp
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[var(--color-text-primary)]">
                      {row.Absolute_Gap.toFixed(2)} pp
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
