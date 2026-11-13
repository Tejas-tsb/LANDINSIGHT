import { useState, useMemo } from 'react';
import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ClusterBadge } from '../components/ui/ClusterBadge';
import {
  INDICATOR_METADATA,
  PERCENTAGE_INDICATORS,
  BINARY_INDICATORS,
  CLUSTER_CONFIG,
} from '../lib/constants';
import { toTitleCase, formatPercent, formatBinary } from '../lib/utils';
import {
  Search,
  Building,
  Filter,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from 'recharts';

export default function StateExplorer() {
  const { data, isLoading, error, reload } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<'all' | 0 | 1>('all');
  const [selectedStateName, setSelectedStateName] = useState<string>('ANDHRA PRADESH');

  if (isLoading) {
    return <LoadingState message="Loading State/UT profiles..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={reload} />;
  }

  const { enrichedStates, clusterProfiles } = data;

  // Filtered state list
  const filteredStates = useMemo(() => {
    return enrichedStates.filter((state) => {
      const matchesSearch = state.State_UT.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCluster =
        selectedClusterFilter === 'all' || state.Cluster === selectedClusterFilter;
      return matchesSearch && matchesCluster;
    });
  }, [enrichedStates, searchTerm, selectedClusterFilter]);

  // Selected state data
  const activeState = useMemo(() => {
    return (
      enrichedStates.find((s) => s.State_UT === selectedStateName) ||
      enrichedStates[0]
    );
  }, [enrichedStates, selectedStateName]);

  const activeClusterProfile = useMemo(() => {
    return clusterProfiles.find((p) => p.Cluster === activeState.Cluster);
  }, [clusterProfiles, activeState]);

  // Prepare radar chart comparing the state's percentage indicators against its cluster mean
  const radarData = useMemo(() => {
    if (!activeState || !activeClusterProfile) return [];
    return PERCENTAGE_INDICATORS.map((key) => {
      const meta = INDICATOR_METADATA[key];
      const stateVal = (activeState as unknown as Record<string, number | null>)[key];
      const clusterMean = (activeClusterProfile as unknown as Record<string, number | null>)[key];
      return {
        subject: meta?.shortLabel || key,
        State: stateVal !== null && stateVal !== undefined ? Number(stateVal.toFixed(1)) : null,
        ClusterMean: clusterMean !== null && clusterMean !== undefined ? Number(clusterMean.toFixed(1)) : null,
        fullMark: 100,
      };
    });
  }, [activeState, activeClusterProfile]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="page-title">State / UT Profile Explorer</h1>
          <p className="page-subtitle">
            Inspect individual governance records, spatial digitization coverage, and benchmark against cluster averages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & State List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card">
            <div className="p-3 border-b border-[var(--color-border)] space-y-2">
              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                />
                <input
                  type="text"
                  placeholder="Search 36 States and UTs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Cluster Filter Buttons */}
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => setSelectedClusterFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                    selectedClusterFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                  }`}
                >
                  All (36)
                </button>
                <button
                  onClick={() => setSelectedClusterFilter(0)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                    selectedClusterFilter === 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                  }`}
                >
                  Cluster 0 (7)
                </button>
                <button
                  onClick={() => setSelectedClusterFilter(1)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                    selectedClusterFilter === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                  }`}
                >
                  Cluster 1 (29)
                </button>
              </div>
            </div>

            {/* Scrollable State List */}
            <div className="divide-y divide-[var(--color-border)] max-h-[620px] overflow-y-auto">
              {filteredStates.map((state) => {
                const isSelected = state.State_UT === activeState.State_UT;
                return (
                  <button
                    key={state.State_UT}
                    onClick={() => setSelectedStateName(state.State_UT)}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600'
                        : 'hover:bg-[var(--color-surface-tertiary)]/50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {toTitleCase(state.State_UT)}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">
                        {state.Total_Districts !== null ? `${state.Total_Districts} Districts` : 'Districts N/A'} ·{' '}
                        {state.Total_Villages !== null ? `${state.Total_Villages.toLocaleString()} Villages` : 'Villages N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClusterBadge cluster={state.Cluster} size="sm" />
                      <ChevronRight
                        size={14}
                        className={isSelected ? 'text-blue-600' : 'text-[var(--color-text-tertiary)]'}
                      />
                    </div>
                  </button>
                );
              })}
              {filteredStates.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--color-text-tertiary)]">
                  No States or UTs matching filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Profile View (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* State Title Banner */}
          <div className="card">
            <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {toTitleCase(activeState.State_UT)}
                  </h2>
                  <ClusterBadge cluster={activeState.Cluster} size="md" />
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Administrative Scale: {activeState.Total_Districts !== null ? `${activeState.Total_Districts} Total Districts` : 'Districts N/A'} |{' '}
                  {activeState.Total_Villages !== null ? `${activeState.Total_Villages.toLocaleString()} Total Villages` : 'Villages N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[var(--color-text-tertiary)] block">Cluster Baseline</span>
                <span className="text-xs font-semibold text-blue-600">
                  {CLUSTER_CONFIG[activeState.Cluster as keyof typeof CLUSTER_CONFIG].displayName} ({activeState.Cluster_Percentage.toFixed(1)}% of India)
                </span>
              </div>
            </div>

            {/* Radar Comparison Chart */}
            <div className="card-body">
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                Multivariate Performance Profile vs Cluster Mean
              </h3>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: 'var(--color-text-tertiary)', fontSize: 9 }}
                    />
                    <Radar
                      name={toTitleCase(activeState.State_UT)}
                      dataKey="State"
                      stroke="#2563EB"
                      fill="#2563EB"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name={`${CLUSTER_CONFIG[activeState.Cluster as keyof typeof CLUSTER_CONFIG].displayName} Avg`}
                      dataKey="ClusterMean"
                      stroke="#94A3B8"
                      fill="#94A3B8"
                      fillOpacity={0.2}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Indicator Breakdown Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Indicator Breakdown & Cluster Benchmark
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)]">Indicator</th>
                    <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)]">Category</th>
                    <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">State Value</th>
                    <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">Cluster Mean</th>
                    <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)] text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {/* Percentage Indicators */}
                  {PERCENTAGE_INDICATORS.map((key) => {
                    const meta = INDICATOR_METADATA[key];
                    const val = (activeState as unknown as Record<string, number | null>)[key];
                    const cMean = activeClusterProfile
                      ? (activeClusterProfile as unknown as Record<string, number | null>)[key]
                      : null;
                    const diff =
                      val !== null && val !== undefined && cMean !== null && cMean !== undefined
                        ? val - cMean
                        : null;
                    return (
                      <tr key={key} className="hover:bg-[var(--color-surface-tertiary)]/50">
                        <td className="py-2 px-4 font-medium text-[var(--color-text-primary)]">
                          {meta?.label || key}
                        </td>
                        <td className="py-2 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            Percentage Coverage
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-medium text-[var(--color-text-primary)]">
                          {val !== null && val !== undefined ? `${val.toFixed(1)}%` : <span className="text-slate-400 italic">N/A</span>}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[var(--color-text-tertiary)]">
                          {cMean !== null && cMean !== undefined ? `${cMean.toFixed(1)}%` : <span className="text-slate-400 italic">N/A</span>}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-xs">
                          {diff !== null ? (
                            <span
                              className={
                                diff >= 0
                                  ? 'text-emerald-600 font-semibold'
                                  : 'text-amber-600 font-semibold'
                              }
                            >
                              {diff >= 0 ? '+' : ''}
                              {diff.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Binary Service Indicators */}
                  {BINARY_INDICATORS.map((key) => {
                    const meta = INDICATOR_METADATA[key];
                    const val = (activeState as unknown as Record<string, number | null>)[key];
                    const cMean = activeClusterProfile
                      ? (activeClusterProfile as unknown as Record<string, number | null>)[key]
                      : null;
                    return (
                      <tr key={key} className="hover:bg-[var(--color-surface-tertiary)]/50">
                        <td className="py-2 px-4 font-medium text-[var(--color-text-primary)]">
                          {meta?.label || key}
                        </td>
                        <td className="py-2 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Citizen Service
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-medium">
                          {val === 1 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <Check size={12} /> Yes (Active)
                            </span>
                          ) : val === 0 ? (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                              <X size={12} /> No (Inactive)
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unavailable (N/A)</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[var(--color-text-tertiary)]">
                          {cMean !== null && cMean !== undefined ? `${cMean.toFixed(1)}% of Cluster` : 'N/A'}
                        </td>
                        <td className="py-2 px-4 text-right text-[var(--color-text-tertiary)]">
                          —
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
