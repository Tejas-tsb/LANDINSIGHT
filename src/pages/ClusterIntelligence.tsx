import { useState, useMemo } from 'react';
import { useData } from '../lib/dataContext';
import { useSelectedClusterData, ExplorerProfile } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ComparisonBarChart, ComparisonBarData } from '../components/charts/ComparisonBarChart';
import {
  INDICATOR_METADATA,
  PERCENTAGE_INDICATORS,
  BINARY_INDICATORS,
  CLUSTER_CONFIG,
} from '../lib/constants';
import { toTitleCase } from '../lib/utils';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Table as TableIcon,
  CheckCircle2,
  TrendingDown,
  Info,
} from 'lucide-react';

export default function ClusterIntelligence() {
  const { isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();

  // State to track expanded membership lists per cluster
  const [expandedClusters, setExpandedClusters] = useState<Record<number, boolean>>({});
  // State to toggle full detailed table
  const [showFullTable, setShowFullTable] = useState(true);

  // Filter binary keys based on model configuration — must be declared before any conditional returns
  const citizenServiceKeys = useMemo(() => {
    const configId = selected.config?.id;
    if (configId === 'Model_C_K2') {
      return [
        'Online_RoR_Download',
        'Digitally_Signed_RoR',
        'Online_Mutation_Application',
        'Auto_Triggered_Mutation',
      ];
    }
    return BINARY_INDICATORS;
  }, [selected.config?.id]);

  if (isLoading || selected.isExplorerLoading) {
    return <LoadingState message="Loading cluster profile intelligence..." />;
  }

  if (error || selected.explorerError || !selected.config) {
    return (
      <ErrorState
        message={error || selected.explorerError || 'Failed to load cluster data.'}
        onRetry={reload}
      />
    );
  }

  const { config, profiles, enrichedStates } = selected;
  const isK2 = profiles.length === 2;

  // Build cluster series colors for charts
  const series = profiles.map((profile) => ({
    key: `cluster${profile.Cluster}`,
    name: `Cluster ${profile.Cluster}`,
    color: CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B',
  }));

  // Build chart dataset for an array of feature keys
  const buildChart = (keys: string[]): ComparisonBarData[] =>
    keys.map((key) => ({
      indicator: key,
      shortLabel: INDICATOR_METADATA[key]?.shortLabel ?? key,
      cluster0: null,
      cluster1: null,
      clusters: Object.fromEntries(
        profiles.map((profile) => [`cluster${profile.Cluster}`, Number(profile[key] ?? 0)])
      ),
    }));

  // Dynamic helper to identify high and low indicators for any cluster profile
  const getProfileHighlights = (profile: ExplorerProfile) => {
    const scored = Object.entries(INDICATOR_METADATA)
      .filter(([key]) => profile[key] !== undefined)
      .map(([key, meta]) => ({
        key,
        label: meta.shortLabel,
        value: Number(profile[key] ?? 0),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      highest: scored.slice(0, 2),
      lowest: scored.slice(-2).reverse(),
    };
  };

  // Toggle state membership expansion
  const toggleClusterExpansion = (clusterId: number) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  };

  // All 14 indicators for the comprehensive breakdown table
  const all14Indicators = [...PERCENTAGE_INDICATORS, ...BINARY_INDICATORS];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          SECTION A: Cluster Overview & Compact Visual Summary
         ========================================================================= */}
      <div className="pb-3 border-b border-[var(--color-border)]">
        <p className="page-subtitle text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
          Compare the {config.k} groups found by {config.model}. Clusters reflect similar patterns, not rankings.
        </p>
      </div>

      {/* Overview Distribution Strip */}
      <div className="card p-4 bg-[var(--color-surface-secondary)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)] text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-text-primary)]">National Distribution</span>
            <span className="text-[var(--color-text-tertiary)]">·</span>
            <span className="text-[var(--color-text-secondary)]">{config.k} Clusters Partitioning 36 States/UTs</span>
          </div>
          <span className="text-[var(--color-text-tertiary)] font-mono text-[11px]">
            100% of Entities Assigned (N=36)
          </span>
        </div>

        <div className={`grid gap-2.5 pt-3 ${profiles.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-5'}`}>
          {profiles.map((profile) => {
            const color = CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B';
            return (
              <div
                key={profile.Cluster}
                className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-xs text-[var(--color-text-primary)] truncate">
                    Cluster {profile.Cluster}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-[var(--color-text-secondary)] shrink-0">
                  {profile.State_UT_Count} ({profile.Cluster_Percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTIONS B & C: Cluster Profiles & Compact State/UT Membership
         ========================================================================= */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${config.k >= 4 ? 'xl:grid-cols-2' : 'xl:grid-cols-3'} gap-5`}>
        {profiles.map((profile) => {
          const members = enrichedStates.filter((state) => state.Cluster === profile.Cluster);
          const color = CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B';
          const { highest, lowest } = getProfileHighlights(profile);
          const isExpanded = !!expandedClusters[profile.Cluster];

          // Initial member preview limit
          const previewLimit = 8;
          const displayMembers = isExpanded ? members : members.slice(0, previewLimit);

          return (
            <section
              key={profile.Cluster}
              className="card border-l-4 flex flex-col justify-between"
              style={{ borderLeftColor: color }}
            >
              <div className="card-header pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <h2 className="font-semibold text-sm text-[var(--color-text-primary)] leading-tight">
                      Cluster {profile.Cluster}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] shrink-0">
                    {profile.State_UT_Count} States/UTs ({profile.Cluster_Percentage.toFixed(1)}%)
                  </span>
                </div>

                {/* Data-Driven Highlights */}
                <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span className="font-medium">Highest profile averages:</span>
                    <span className="text-[var(--color-text-secondary)] truncate">
                      {highest.map((h) => `${h.label} (${h.value.toFixed(1)}%)`).join(' · ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <TrendingDown size={13} className="shrink-0" />
                    <span className="font-medium">Lowest profile averages:</span>
                    <span className="text-[var(--color-text-secondary)] truncate">
                      {lowest.map((l) => `${l.label} (${l.value.toFixed(1)}%)`).join(' · ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* State/UT Membership */}
              <div className="card-body pt-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-[var(--color-text-secondary)]">
                      Assigned States & UTs ({members.length})
                    </span>
                    {members.length > previewLimit && (
                      <button
                        type="button"
                        onClick={() => toggleClusterExpansion(profile.Cluster)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 cursor-pointer"
                      >
                        {isExpanded ? 'Show less' : `+${members.length - previewLimit} more`}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {displayMembers.map((state) => (
                      <span
                        key={state.State_UT}
                        className="text-[11px] px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      >
                        {toTitleCase(state.State_UT)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[10px] text-[var(--color-text-tertiary)] flex items-center justify-between">
                  <span>Cluster {profile.Cluster} Profile</span>
                  <span>Model: {config.model} (K={config.k})</span>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION D: Governance Indicator Comparison (Two Focused Groups)
         ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Group 1: Cadastral & Spatial Infrastructure */}
        <section className="card flex flex-col justify-between">
          <div className="card-header pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Cadastral & Spatial Coverage (% Means)
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Cluster-level averages across nine spatial mapping and land record modernization indicators
            </p>
          </div>
          <div className="card-body">
            <ComparisonBarChart
              data={buildChart(PERCENTAGE_INDICATORS)}
              clusterSeries={series}
              layout="vertical"
              height={380}
            />
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-3 pt-3 border-t border-[var(--color-border)]">
              Map-RoR Linkage and parcel ULPIN integration exhibit the highest inter-cluster variation nationwide.
            </p>
          </div>
        </section>

        {/* Group 2: Citizen Services & Digital Transactions */}
        <section className="card flex flex-col justify-between">
          <div className="card-header pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Citizen Service Adoption (% Available)
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Cluster average availability for the selected binary service indicators, shown as percentages
            </p>
          </div>
          <div className="card-body">
            <ComparisonBarChart
              data={buildChart(citizenServiceKeys)}
              clusterSeries={series}
              layout="vertical"
              height={300}
            />
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-3 pt-3 border-t border-[var(--color-border)]">
              *100% indicates universal availability across all member States/UTs within the respective cluster.
            </p>
          </div>
        </section>
      </div>

      {/* =========================================================================
          SECTION E: Detailed Statistical Breakdown (All 14 Indicators)
         ========================================================================= */}
      <section className="card overflow-hidden">
        <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TableIcon size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Comprehensive Cluster Means & Differential Breakdown
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Full 14-indicator baseline averages across all {config.k} clusters · percentage values
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFullTable(!showFullTable)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            {showFullTable ? 'Collapse Table' : 'Expand Full Matrix'}
            {showFullTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showFullTable && (
          <div className="overflow-x-auto border-t border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] text-left border-b border-[var(--color-border)]">
                  <th className="py-2.5 px-3 font-semibold text-[var(--color-text-primary)]">Governance Indicator</th>
                  <th className="py-2.5 px-3 font-semibold text-[var(--color-text-tertiary)]">Category</th>
                  {profiles.map((p) => {
                    const color = CLUSTER_CONFIG[p.Cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B';
                    return (
                      <th key={p.Cluster} className="py-2.5 px-3 text-right font-semibold text-[var(--color-text-primary)]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          Cluster {p.Cluster}
                        </span>
                      </th>
                    );
                  })}
                  {isK2 ? (
                    <>
                      <th className="py-2.5 px-3 text-right font-semibold text-[var(--color-text-primary)]">
                        Difference (C1 - C0)
                      </th>
                      <th className="py-2.5 px-3 text-right font-semibold text-[var(--color-text-primary)]">
                        Absolute Gap
                      </th>
                    </>
                  ) : (
                    <th className="py-2.5 px-3 text-right font-semibold text-[var(--color-text-primary)]">
                      Spread (Max - Min)
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {all14Indicators.map((key) => {
                  const meta = INDICATOR_METADATA[key];
                  const means = profiles.map((p) => Number(p[key] ?? 0));
                  const minMean = Math.min(...means);
                  const maxMean = Math.max(...means);
                  const spread = maxMean - minMean;
                  const diff = isK2 ? means[1] - means[0] : 0;
                  const isPercentageCategory = PERCENTAGE_INDICATORS.includes(key);

                  return (
                    <tr
                      key={key}
                      className="hover:bg-[var(--color-surface-secondary)]/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-medium text-[var(--color-text-primary)]">
                        {meta?.label ?? key}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[var(--color-text-tertiary)]">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                          {isPercentageCategory ? 'Cadastral' : 'Citizen Service'}
                        </span>
                      </td>
                      {profiles.map((p) => (
                        <td
                          key={p.Cluster}
                          className="py-2 px-3 text-right font-mono text-[var(--color-text-secondary)]"
                        >
                          {Number(p[key] ?? 0).toFixed(1)}%
                        </td>
                      ))}
                      {isK2 ? (
                        <>
                          <td className="py-2 px-3 text-right font-mono font-medium">
                            <span className={diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                              {diff >= 0 ? '+' : ''}
                              {diff.toFixed(1)} pp
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                            {spread.toFixed(1)} pp
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                          {spread.toFixed(1)} pp
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-3 bg-[var(--color-surface-secondary)]/60 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1.5">
                <Info size={13} className="text-blue-600" />
                {isK2
                  ? 'Difference calculates Cluster 1 Mean minus Cluster 0 Mean in percentage points (pp). Both clusters derived from Model C (13 features).'
                  : `Spread calculates maximum cluster mean minus minimum cluster mean in percentage points (pp) across all ${config.k} clusters.`}
              </span>
              <span className="font-mono">14 Indicators Reported</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
