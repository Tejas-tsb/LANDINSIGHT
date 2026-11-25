import { useState, useMemo, useEffect } from 'react';
import { useData } from '../lib/dataContext';
import { useSelectedClusterData } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { StatCard } from '../components/ui/StatCard';
import { ClusterBadge } from '../components/ui/ClusterBadge';
import {
  INDICATOR_METADATA,
  MODEL_C_FEATURES,
  MODEL_B_FEATURES,
  ALL_CLUSTERING_FEATURES,
  CLUSTER_CONFIG,
  RECHARTS_TOOLTIP_PROPS,
} from '../lib/constants';
import { mean } from '../lib/utils';
import {
  buildIndicatorStateRows,
  clusterColorForIndicatorRow,
  INDICATOR_CHART_PAGE_SIZE,
  pageIndicatorStateRows,
  sortIndicatorStateRows,
} from '../lib/indicatorAnalytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Filter,
  ArrowUpDown,
  Search,
  Table as TableIcon,
  BarChart3,
} from 'lucide-react';

/** Fixed Descriptive Analytical Bands definition (not official DILRMP classifications) */
const DESCRIPTIVE_BANDS = [
  { id: 'saturation', label: 'High Saturation / Advanced Progress', min: 90, max: 100, color: '#16A34A', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'substantial', label: 'Substantial Progress', min: 70, max: 89.999, color: '#2563EB', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'developing', label: 'Developing / Intermediate Progress', min: 40, max: 69.999, color: '#D97706', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
  { id: 'nascent', label: 'Nascent Progress', min: 0, max: 39.999, color: '#DC2626', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
] as const;

export default function IndicatorAnalytics() {
  const { data, isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'percentage' | 'binary'>('all');
  const [activeIndicatorKey, setActiveIndicatorKey] = useState<string>('Map_Digitization_Pct');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc');
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');
  const [searchQuery, setSearchQuery] = useState('');
  const [clusterFilter, setClusterFilter] = useState<'all' | number>('all');
  const [showBoundaryModal, setShowBoundaryModal] = useState<'max' | 'min' | null>(null);
  const [chartPage, setChartPage] = useState(0);

  // Active configuration details
  const config = selected.config;
  const configId = config?.id ?? 'Model_C_K2';
  const profiles = selected.profiles ?? [];
  const enrichedStates = selected.enrichedStates.length > 0 ? selected.enrichedStates : (data?.enrichedStates ?? []);

  // Determine feature list for active model configuration
  const activeModelFeatures = useMemo(() => {
    if (configId.startsWith('Model_B')) {
      return MODEL_B_FEATURES;
    }
    return MODEL_C_FEATURES;
  }, [configId]);

  useEffect(() => {
    setChartPage(0);
    setClusterFilter('all');
    setSearchQuery('');
    if (!activeModelFeatures.includes(activeIndicatorKey)) {
      setSelectedCategory('all');
      setActiveIndicatorKey(activeModelFeatures[0] ?? 'Map_Digitization_Pct');
    }
  }, [configId, activeModelFeatures, activeIndicatorKey]);

  // Filter indicators by category according to active model feature space
  const filteredIndicatorKeys = useMemo(() => {
    return activeModelFeatures.filter((key) => {
      const meta = INDICATOR_METADATA[key];
      if (selectedCategory === 'all') return true;
      return meta?.category === selectedCategory;
    });
  }, [activeModelFeatures, selectedCategory]);

  // Handle category change and prevent desynchronization
  const handleCategoryChange = (newCat: 'all' | 'percentage' | 'binary') => {
    setSelectedCategory(newCat);
    const validKeys = activeModelFeatures.filter((key) => {
      const meta = INDICATOR_METADATA[key];
      if (newCat === 'all') return true;
      return meta?.category === newCat;
    });
    if (validKeys.length > 0 && !validKeys.includes(activeIndicatorKey)) {
      setActiveIndicatorKey(validKeys[0]);
    }
  };

  // Active indicator metadata
  const activeMeta = INDICATOR_METADATA[activeIndicatorKey] || {
    key: activeIndicatorKey,
    label: activeIndicatorKey,
    shortLabel: activeIndicatorKey,
    category: 'percentage',
    description: '',
    unit: '%',
  };

  const isPercentage = activeMeta.category === 'percentage';

  // Check whether active indicator is in the active model's clustering feature space
  const isFeatureInActiveModel = activeModelFeatures.includes(activeIndicatorKey);

  // Raw list for all 36 states with assigned cluster for the active indicator
  const stateValuesList = useMemo(() => {
    return buildIndicatorStateRows(enrichedStates, activeIndicatorKey);
  }, [enrichedStates, activeIndicatorKey]);

  // Sorted data for charts and rankings
  const chartData = useMemo(() => {
    return sortIndicatorStateRows(stateValuesList, sortOrder);
  }, [stateValuesList, sortOrder]);

  const chartPageCount = Math.max(1, Math.ceil(chartData.length / INDICATOR_CHART_PAGE_SIZE));
  const chartPageData = pageIndicatorStateRows(chartData, chartPage);
  const chartPageStart = chartData.length === 0 ? 0 : chartPage * INDICATOR_CHART_PAGE_SIZE + 1;
  const chartPageEnd = Math.min((chartPage + 1) * INDICATOR_CHART_PAGE_SIZE, chartData.length);

  // Filtered list for search and cluster filter in table view
  const filteredTableData = useMemo(() => {
    return chartData.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCluster = clusterFilter === 'all' || item.cluster === clusterFilter;
      return matchesSearch && matchesCluster;
    });
  }, [chartData, searchQuery, clusterFilter]);

  // Calculate descriptive statistical summary for the active indicator
  const stats = useMemo(() => {
    const validValues = stateValuesList
      .map((d) => d.value)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    const nationalMean = validValues.length > 0 ? mean(validValues) : null;
    const sortedValues = [...validValues].sort((a, b) => a - b);
    const medianVal = sortedValues.length > 0
      ? sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)]
      : null;

    const maxVal = validValues.length > 0 ? Math.max(...validValues) : null;
    const minVal = validValues.length > 0 ? Math.min(...validValues) : null;

    const maxStates = maxVal !== null ? stateValuesList.filter((d) => d.value === maxVal).map((d) => d.name) : [];
    const minStates = minVal !== null ? stateValuesList.filter((d) => d.value === minVal).map((d) => d.name) : [];

    // Binary adoption metrics
    const adoptedCount = validValues.filter((v) => v === 1).length;
    const adoptionRatePct = validValues.length > 0 ? (adoptedCount / validValues.length) * 100 : null;

    // Fixed Descriptive Analytical Bands distribution counts (for percentage indicators)
    const bandDistribution = DESCRIPTIVE_BANDS.map((band) => {
      const count = validValues.filter((v) => v >= band.min && v <= band.max).length;
      const pct = validValues.length > 0 ? (count / validValues.length) * 100 : 0;
      return { ...band, count, pct };
    });

    // Dynamic cluster profile means calculated from state assignments
    const clusterMeans: { cluster: number; mean: number | null; count: number; percentage: number }[] = [];
    const k = config?.k ?? profiles.length;

    for (let c = 0; c < k; c++) {
      const clusterStates = stateValuesList.filter((s) => s.cluster === c);
      const cVals = clusterStates
        .map((s) => s.value)
        .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

      const cMean = cVals.length > 0 ? mean(cVals) : null;
      const cPct = (clusterStates.length / (stateValuesList.length || 36)) * 100;

      // Note: for binary features in state records, values are 0 or 1.
      // We convert cluster mean to percentage (0 to 100%) for clean display.
      const displayMean = cMean === null ? null : isPercentage ? cMean : cMean * 100;

      clusterMeans.push({
        cluster: c,
        mean: displayMean,
        count: clusterStates.length,
        percentage: cPct,
      });
    }

    return {
      nationalMean,
      medianVal,
      maxVal,
      minVal,
      maxStates,
      minStates,
      maxStateLabel: maxStates.length > 2 ? `${maxStates[0]} +${maxStates.length - 1} more` : maxStates.length > 0 ? maxStates.join(', ') : 'N/A',
      minStateLabel: minStates.length > 2 ? `${minStates[0]} +${minStates.length - 1} more` : minStates.length > 0 ? minStates.join(', ') : 'N/A',
      adoptedCount,
      unavailableCount: stateValuesList.length - validValues.length,
      adoptionRatePct,
      bandDistribution,
      clusterMeans,
    };
  }, [stateValuesList, config?.k, profiles.length, isPercentage]);

  if (isLoading || selected.isExplorerLoading) {
    return <LoadingState message="Loading indicator analytics..." />;
  }

  if (error || selected.explorerError || !data) {
    return <ErrorState message={error || selected.explorerError || 'Failed to load data.'} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* =========================================================================
          SECTION 2: Indicator Selection, Category Tabs & Sort Controls
         ========================================================================= */}
      <div className="card p-4 space-y-3.5 order-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="text-[var(--color-text-tertiary)] shrink-0" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Category:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                All ({activeModelFeatures.length})
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('percentage')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  selectedCategory === 'percentage'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                Percentage Coverage ({activeModelFeatures.filter((k) => INDICATOR_METADATA[k]?.category === 'percentage').length})
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('binary')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  selectedCategory === 'binary'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                Binary Service Adoption ({activeModelFeatures.filter((k) => INDICATOR_METADATA[k]?.category === 'binary').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-surface-secondary)] text-xs">
              <button
                type="button"
                onClick={() => setActiveView('chart')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                  activeView === 'chart'
                    ? 'bg-[var(--color-surface)] text-blue-600 shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <BarChart3 size={13} />
                <span>Chart View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                  activeView === 'table'
                    ? 'bg-[var(--color-surface)] text-blue-600 shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <TableIcon size={13} />
                <span>36-State Table</span>
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            >
              <ArrowUpDown size={13} />
              <span>Sort: {sortOrder === 'desc' ? 'High to Low' : 'Low to High'}</span>
            </button>
          </div>
        </div>

        {/* Quick Indicator Selection Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-[var(--color-border)]">
          {filteredIndicatorKeys.map((key) => {
            const meta = INDICATOR_METADATA[key];
            const isActive = key === activeIndicatorKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveIndicatorKey(key)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                }`}
              >
                <span>{meta?.shortLabel || key}</span>
                {meta?.category === 'binary' && (
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-blue-700 text-blue-100' : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'}`}>
                    0/1
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Informational Callout regarding Auto_Mutation in Model C */}
        {configId === 'Model_C_K2' && (
          <div className="pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Note on Feature Selection:</strong> Model C clusters on 13 features, excluding <code className="font-mono text-blue-600">Auto_Mutation</code> due to rare binary sensitivity (adopted in 4 of 36 States/UTs: AP, MP, MH, RJ).
            </span>
            <button
              type="button"
              onClick={() => setActiveIndicatorKey('Auto_Mutation')}
              className={`text-xs underline transition-colors ${activeIndicatorKey === 'Auto_Mutation' ? 'text-blue-600 font-semibold' : 'hover:text-[var(--color-text-primary)]'}`}
            >
              {activeIndicatorKey === 'Auto_Mutation' ? '✓ Currently Viewing Auto_Mutation' : 'Inspect Auto_Mutation →'}
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: Dynamic Analytical KPI Summary Cards
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 order-3">
        {/* National Benchmark Card */}
        <StatCard
          label={isPercentage ? 'National Mean' : 'Adoption Rate'}
          value={
            stats.nationalMean !== null
              ? isPercentage
                ? `${stats.nationalMean.toFixed(1)}%`
                : stats.adoptionRatePct === null ? 'N/A' : `${stats.adoptionRatePct.toFixed(1)}%`
              : 'N/A'
          }
          subtitle={
            isPercentage
              ? `Median: ${stats.medianVal?.toFixed(1) ?? 'N/A'}% · 36 States/UTs`
              : `${stats.adoptedCount} of ${stateValuesList.length - stats.unavailableCount} reporting States/UTs adopted`
          }
        />

        {/* Dynamic Cluster Profile Means */}
        {stats.clusterMeans.slice(0, 2).map((cm) => {
          const cfg = CLUSTER_CONFIG[cm.cluster as keyof typeof CLUSTER_CONFIG];
          return (
            <StatCard
              key={cm.cluster}
              label={`${cfg?.displayName || `Cluster ${cm.cluster}`} Mean`}
              value={cm.mean === null ? 'N/A' : `${cm.mean.toFixed(1)}%`}
              subtitle={`${cm.count} member states (${cm.percentage.toFixed(1)}%)`}
            />
          );
        })}

        {/* Highest Coverage Card with Expandable Boundary States */}
        <div className="relative">
          <StatCard
            label={isPercentage ? 'Highest Coverage' : 'Most Adopted'}
            value={
              stats.maxVal !== null
                ? isPercentage
                  ? `${stats.maxVal.toFixed(1)}%`
                  : stats.maxVal === 1
                  ? 'Adopted (1)'
                  : '0'
                : 'N/A'
            }
            subtitle={stats.maxStateLabel}
          />
          {stats.maxStates.length > 2 && (
            <button
              type="button"
              onClick={() => setShowBoundaryModal(showBoundaryModal === 'max' ? null : 'max')}
              className="absolute top-2 right-2 text-[10px] text-blue-600 hover:underline font-medium"
            >
              View all ({stats.maxStates.length})
            </button>
          )}
        </div>

        {/* Lowest Coverage Card with Expandable Boundary States */}
        <div className="relative">
          <StatCard
            label={isPercentage ? 'Lowest Coverage' : 'Least Adopted'}
            value={
              stats.minVal !== null
                ? isPercentage
                  ? `${stats.minVal.toFixed(1)}%`
                  : stats.minVal === 0
                  ? 'Not Adopted (0)'
                  : '1'
                : 'N/A'
            }
            subtitle={stats.minStateLabel}
          />
          {stats.minStates.length > 2 && (
            <button
              type="button"
              onClick={() => setShowBoundaryModal(showBoundaryModal === 'min' ? null : 'min')}
              className="absolute top-2 right-2 text-[10px] text-blue-600 hover:underline font-medium"
            >
              View all ({stats.minStates.length})
            </button>
          )}
        </div>
      </div>

      {/* Additional Cluster Means if K > 2 */}
      {stats.clusterMeans.length > 2 && (
        <div className="card p-3 bg-[var(--color-surface-secondary)] order-4">
          <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
            Additional Cluster Profile Means for {config?.model} (K={config?.k}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.clusterMeans.slice(2).map((cm) => {
              const cfg = CLUSTER_CONFIG[cm.cluster as keyof typeof CLUSTER_CONFIG];
              return (
                <div key={cm.cluster} className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg?.color || '#64748B' }} />
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      {cfg?.displayName || `Cluster ${cm.cluster}`} Mean
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{cm.mean === null ? 'N/A' : `${cm.mean.toFixed(1)}%`}</span>
                    <span className="block text-[10px] text-[var(--color-text-tertiary)]">{cm.count} States/UTs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expandable Boundary States Drawer */}
      {showBoundaryModal && (
        <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2 order-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300">
              {showBoundaryModal === 'max' ? `All States at Highest Level (${stats.maxVal}%)` : `All States at Lowest Level (${stats.minVal}%)`}
            </h4>
            <button
              type="button"
              onClick={() => setShowBoundaryModal(null)}
              className="text-xs text-blue-600 hover:underline"
            >
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(showBoundaryModal === 'max' ? stats.maxStates : stats.minStates).map((st) => (
              <span
                key={st}
                className="px-2 py-0.5 rounded text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-blue-200 dark:border-blue-800"
              >
                {st}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 5: Primary Visualization / Tabular Area
         ========================================================================= */}
      {activeView === 'chart' ? (
        <div className="flex flex-col gap-4 order-2">
          {/* A. Fixed Descriptive Analytical Bands Summary (for percentage indicators) */}
          {isPercentage && (
            <div className="card p-4 space-y-2.5 order-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Fixed Descriptive Analytical Bands
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Descriptive statistical intervals across 36 States/UTs (not official DILRMP classifications).
                  </p>
                </div>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">
                  Reporting: {stateValuesList.length - stats.unavailableCount} of {stateValuesList.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {stats.bandDistribution.map((band) => (
                  <div
                    key={band.id}
                    className={`p-2.5 rounded-lg border ${band.border} ${band.bg} flex items-center justify-between`}
                  >
                    <div>
                      <span className="block text-[11px] font-semibold text-[var(--color-text-primary)] truncate" title={band.label}>
                        {band.label}
                      </span>
                      <span className="block text-[10px] text-[var(--color-text-secondary)]">
                        {band.min}% – {band.max === 100 ? '100%' : `${Math.floor(band.max)}%`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{band.count}</span>
                      <span className="block text-[10px] text-[var(--color-text-tertiary)] font-mono">{band.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main ranked chart */}
          <div className="card order-1 min-w-0 overflow-hidden">
            <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {activeMeta.label} ({isPercentage ? 'Coverage %' : 'Adoption Flag 0/1'})
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{activeMeta.description}</p>
                <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isFeatureInActiveModel ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                  {isFeatureInActiveModel ? `Included in ${config?.model} clustering` : `Shown outside ${config?.model} clustering features`}
                </span>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                {/* Cluster Color Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {stats.clusterMeans.map((cm) => {
                    const cfg = CLUSTER_CONFIG[cm.cluster as keyof typeof CLUSTER_CONFIG];
                    return (
                      <span key={cm.cluster} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: cfg?.color || '#2563EB' }} />
                        <span className="text-[var(--color-text-secondary)]">
                          {cfg?.displayName || `Cluster ${cm.cluster}`} ({cm.count})
                        </span>
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span aria-live="polite">States {chartPageStart}–{chartPageEnd} of {chartData.length}</span>
                  <button
                    type="button"
                    aria-label="Previous indicator chart page"
                    onClick={() => setChartPage((page) => Math.max(0, page - 1))}
                    disabled={chartPage === 0}
                    className="btn-secondary px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    aria-label="Next indicator chart page"
                    onClick={() => setChartPage((page) => Math.min(chartPageCount - 1, page + 1))}
                    disabled={chartPage >= chartPageCount - 1}
                    className="btn-secondary px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="w-full h-[340px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartPageData}
                    layout="vertical"
                    margin={{ top: 12, right: 16, left: 0, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={isPercentage ? [0, 100] : [0, 1]}
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                      tickFormatter={(v) => (isPercentage ? `${v}%` : `${v}`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      interval={0}
                      width={150}
                      tick={{ fill: 'var(--color-text-primary)', fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(value: unknown, _name: unknown, entry: { payload?: { cluster: number } }) => {
                        const cNum = entry.payload?.cluster ?? 0;
                        const cLabel = CLUSTER_CONFIG[cNum as keyof typeof CLUSTER_CONFIG]?.displayName || `Cluster ${cNum}`;
                        if (value === null || value === undefined) {
                          return ['Unavailable (N/A)', `${activeMeta.shortLabel} (${cLabel})`];
                        }
                        const formatted = isPercentage
                          ? `${Number(value).toFixed(2)}%`
                          : Number(value) === 1
                          ? '1 (Adopted / Active)'
                          : '0 (Not Adopted)';
                        return [formatted, `${activeMeta.shortLabel} (${cLabel})`];
                      }}
                      {...RECHARTS_TOOLTIP_PROPS}
                    />

                    {/* National Mean Reference Line */}
                    {stats.nationalMean !== null && isPercentage && (
                      <ReferenceLine
                        x={stats.nationalMean}
                        stroke="#2563EB"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Nat'l Mean: ${stats.nationalMean.toFixed(1)}%`,
                          position: 'top',
                          fill: 'var(--color-text-secondary)',
                          fontSize: 10,
                        }}
                      />
                    )}

                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={13}>
                      {chartPageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={clusterColorForIndicatorRow(entry.cluster)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            SECTION 5B: Full 36-State Ranking Table View
           ========================================================================= */
        <div className="card space-y-3 order-2">
          <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                36-State Performance & Ranking Matrix — {activeMeta.label}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Examine individual State/UT coverage, descriptive bands, and active cluster assignment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Filter */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Filter state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:border-blue-600 w-36 sm:w-44"
                />
              </div>

              {/* Cluster Filter */}
              <select
                aria-label="Filter by cluster"
                value={clusterFilter}
                onChange={(e) => setClusterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none cursor-pointer"
              >
                <option value="all">All Clusters</option>
                {stats.clusterMeans.map((cm) => (
                  <option key={cm.cluster} value={cm.cluster}>
                    Cluster {cm.cluster} ({cm.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                  <th className="py-2.5 px-4 font-semibold text-[var(--color-text-secondary)]">Rank</th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--color-text-secondary)]">State / Union Territory</th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--color-text-secondary)] text-right">Value</th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--color-text-secondary)]">Descriptive Classification</th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--color-text-secondary)]">Cluster Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredTableData.map((row, idx) => {
                  let bandLabel = 'N/A';
                  let bandStyle = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

                  if (isPercentage && row.value !== null) {
                    if (row.value >= 90) {
                      bandLabel = 'High Saturation (≥90%)';
                      bandStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
                    } else if (row.value >= 70) {
                      bandLabel = 'Substantial (70–89%)';
                      bandStyle = 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
                    } else if (row.value >= 40) {
                      bandLabel = 'Developing (40–69%)';
                      bandStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
                    } else {
                      bandLabel = 'Nascent (<40%)';
                      bandStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
                    }
                  } else if (!isPercentage && row.value !== null) {
                    if (row.value === 1) {
                      bandLabel = 'Adopted / Active';
                      bandStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
                    } else {
                      bandLabel = 'Not Adopted';
                      bandStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
                    }
                  }

                  return (
                    <tr key={row.fullName} className="hover:bg-[var(--color-surface-tertiary)]/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-blue-600">#{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">{row.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                        {row.value !== null
                          ? isPercentage
                            ? `${row.value.toFixed(2)}%`
                            : row.value === 1
                            ? '1 (Active)'
                            : '0 (Not Adopted)'
                          : 'N/A'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${bandStyle}`}>
                          {bandLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <ClusterBadge cluster={row.cluster} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
