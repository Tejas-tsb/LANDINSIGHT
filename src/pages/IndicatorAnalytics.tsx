import { useState, useMemo } from 'react';
import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { StatCard } from '../components/ui/StatCard';
import { ClusterBadge } from '../components/ui/ClusterBadge';
import {
  INDICATOR_METADATA,
  MODEL_C_FEATURES,
  PERCENTAGE_INDICATORS,
  BINARY_INDICATORS,
  CLUSTER_CONFIG,
} from '../lib/constants';
import { toTitleCase, mean } from '../lib/utils';
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
import { BarChart3, Filter, ArrowUpDown } from 'lucide-react';

export default function IndicatorAnalytics() {
  const { data, isLoading, error, reload } = useData();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'percentage' | 'binary'>('all');
  const [activeIndicatorKey, setActiveIndicatorKey] = useState<string>('Map_Digitization_Pct');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  if (isLoading) {
    return <LoadingState message="Loading indicator analytics..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={reload} />;
  }

  const { enrichedStates, clusterProfiles } = data;

  // Filter indicators by category
  const filteredIndicatorKeys = useMemo(() => {
    return MODEL_C_FEATURES.filter((key) => {
      const meta = INDICATOR_METADATA[key];
      if (selectedCategory === 'all') return true;
      return meta?.category === selectedCategory;
    });
  }, [selectedCategory]);

  const activeMeta = INDICATOR_METADATA[activeIndicatorKey] || {
    key: activeIndicatorKey,
    label: activeIndicatorKey,
    shortLabel: activeIndicatorKey,
    category: 'percentage',
    description: '',
    unit: '%',
  };

  // Prepare sorted data for all 36 states for the active indicator
  const chartData = useMemo(() => {
    const rawList = enrichedStates.map((s) => ({
      name: toTitleCase(s.State_UT),
      fullName: s.State_UT,
      value: (s as unknown as Record<string, number | null>)[activeIndicatorKey] ?? null,
      cluster: s.Cluster,
    }));

    return rawList.sort((a, b) => {
      if (a.value === null && b.value === null) return 0;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      if (sortOrder === 'desc') return b.value - a.value;
      return a.value - b.value;
    });
  }, [enrichedStates, activeIndicatorKey, sortOrder]);

  // Summary statistics for the active indicator
  const stats = useMemo(() => {
    const validValues = chartData
      .map((d) => d.value)
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
    const natMean = validValues.length > 0 ? mean(validValues) : null;
    const maxVal = validValues.length > 0 ? Math.max(...validValues) : null;
    const minVal = validValues.length > 0 ? Math.min(...validValues) : null;
    const maxStates = maxVal !== null ? chartData.filter((d) => d.value === maxVal).map((d) => d.name) : [];
    const minStates = minVal !== null ? chartData.filter((d) => d.value === minVal).map((d) => d.name) : [];

    const c0Profile = clusterProfiles.find((p) => p.Cluster === 0);
    const c1Profile = clusterProfiles.find((p) => p.Cluster === 1);

    const c0Mean = c0Profile
      ? (c0Profile as unknown as Record<string, number | null>)[activeIndicatorKey] ?? null
      : null;
    const c1Mean = c1Profile
      ? (c1Profile as unknown as Record<string, number | null>)[activeIndicatorKey] ?? null
      : null;

    return {
      nationalMean: natMean,
      maxVal,
      minVal,
      maxStateLabel: maxStates.length > 2 ? `${maxStates[0]} +${maxStates.length - 1} more` : maxStates.length > 0 ? maxStates.join(', ') : 'N/A',
      minStateLabel: minStates.length > 2 ? `${minStates[0]} +${minStates.length - 1} more` : minStates.length > 0 ? minStates.join(', ') : 'N/A',
      c0Mean,
      c1Mean,
    };
  }, [chartData, clusterProfiles, activeIndicatorKey]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="page-title">Indicator Analytics & Distributions</h1>
          <p className="page-subtitle">
            Evaluate national adoption patterns across all 13 Model C features for 36 States and UTs.
          </p>
        </div>
      </div>

      {/* Indicator Selection and Filter Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[var(--color-text-tertiary)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Category:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                All (13)
              </button>
              <button
                onClick={() => setSelectedCategory('percentage')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  selectedCategory === 'percentage'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                Percentage Coverage (9)
              </button>
              <button
                onClick={() => setSelectedCategory('binary')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  selectedCategory === 'binary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                Binary Service Adoption (4)
              </button>
            </div>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn-secondary text-xs py-1 px-2.5"
          >
            <ArrowUpDown size={14} />
            Sort: {sortOrder === 'desc' ? 'High to Low' : 'Low to High'}
          </button>
        </div>

        {/* Quick Indicator Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--color-border)]">
          {filteredIndicatorKeys.map((key) => {
            const meta = INDICATOR_METADATA[key];
            const isActive = key === activeIndicatorKey;
            return (
              <button
                key={key}
                onClick={() => setActiveIndicatorKey(key)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                {meta?.shortLabel || key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards for Active Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="National Mean"
          value={
            stats.nationalMean !== null
              ? activeMeta.category === 'percentage'
                ? `${stats.nationalMean.toFixed(1)}%`
                : `${stats.nationalMean.toFixed(2)} / 1.0`
              : 'N/A'
          }
          subtitle="Across all reporting States/UTs"
        />
        <StatCard
          label={`${CLUSTER_CONFIG[0].displayName} Mean`}
          value={
            stats.c0Mean !== null
              ? `${stats.c0Mean.toFixed(1)}%`
              : 'N/A'
          }
          subtitle="7 member entities"
        />
        <StatCard
          label={`${CLUSTER_CONFIG[1].displayName} Mean`}
          value={
            stats.c1Mean !== null
              ? `${stats.c1Mean.toFixed(1)}%`
              : 'N/A'
          }
          subtitle="29 member entities"
        />
        <StatCard
          label="Highest Coverage"
          value={
            stats.maxVal !== null
              ? activeMeta.category === 'percentage'
                ? `${stats.maxVal.toFixed(1)}%`
                : stats.maxVal === 1
                ? 'Adopted (1)'
                : '0'
              : 'N/A'
          }
          subtitle={stats.maxStateLabel}
        />
        <StatCard
          label="Lowest Coverage"
          value={
            stats.minVal !== null
              ? activeMeta.category === 'percentage'
                ? `${stats.minVal.toFixed(1)}%`
                : stats.minVal === 0
                ? 'Not Adopted (0)'
                : '1'
              : 'N/A'
          }
          subtitle={stats.minStateLabel}
        />
      </div>

      {/* Main Bar Chart across 36 States/UTs */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              {activeMeta.label} ({activeMeta.category === 'percentage' ? 'Coverage %' : 'Adoption Flag 0/1'})
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {activeMeta.description} · Bars colored by K-Means cluster assignment
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: CLUSTER_CONFIG[0].color }} />
              {CLUSTER_CONFIG[0].displayName}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: CLUSTER_CONFIG[1].color }} />
              {CLUSTER_CONFIG[1].displayName}
            </span>
          </div>
        </div>

        <div className="card-body">
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 65 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={80}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
                />
                <YAxis
                  domain={activeMeta.category === 'percentage' ? [0, 100] : [0, 1]}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  tickFormatter={(v) => (activeMeta.category === 'percentage' ? `${v}%` : `${v}`)}
                />
                <Tooltip
                  formatter={(value: unknown, _name: unknown, entry: { payload?: { cluster: number } }) => {
                    const cNum = entry.payload?.cluster ?? 0;
                    const cLabel = CLUSTER_CONFIG[cNum as keyof typeof CLUSTER_CONFIG]?.displayName || `Cluster ${cNum}`;
                    if (value === null || value === undefined) {
                      return ['Unavailable (N/A)', `${activeMeta.shortLabel} (${cLabel})`];
                    }
                    const formatted =
                      activeMeta.category === 'percentage'
                        ? `${Number(value).toFixed(2)}%`
                        : Number(value) === 1
                        ? '1 (Active)'
                        : '0 (Not Adopted)';
                    return [formatted, `${activeMeta.shortLabel} (${cLabel})`];
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CLUSTER_CONFIG[entry.cluster as keyof typeof CLUSTER_CONFIG]?.color || '#2563EB'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
