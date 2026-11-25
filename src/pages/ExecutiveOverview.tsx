import { useState } from 'react';
import { useData } from '../lib/dataContext';
import { useSelectedClusterData } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ClusterDistributionPie } from '../components/charts/ClusterDistributionPie';
import { ComparisonBarChart, ComparisonBarData } from '../components/charts/ComparisonBarChart';
import { INDICATOR_METADATA, PERCENTAGE_INDICATORS, CLUSTER_CONFIG } from '../lib/constants';
import {
  PieChart as PieIcon,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  TrendingUp,
  GitBranch,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExecutiveOverview() {
  const { data, isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (isLoading || selected.isExplorerLoading) {
    return <LoadingState message="Loading governance intelligence dataset..." />;
  }

  if (error || selected.explorerError || !data || !selected.config) {
    return (
      <ErrorState
        message={error || selected.explorerError || 'Failed to initialize dataset.'}
        onRetry={reload}
      />
    );
  }

  const { config, enrichedStates, profiles, gaps } = selected;
  const sortedGaps = [...gaps].filter((gap) => Number.isFinite(gap.Absolute_Gap)).sort((a, b) => b.Absolute_Gap - a.Absolute_Gap);
  const largestGap = sortedGaps[0];
  const largestServiceGap = sortedGaps.find((gap) => gap.Category === 'Binary Adoption');
  const mapRorGap = sortedGaps.find((gap) => gap.Feature === 'Map_RoR_Linkage_Pct');
  const ulpinGap = sortedGaps.find((gap) => gap.Feature === 'Land_Parcel_ULPIN_Pct');
  const onlineMutationGap = sortedGaps.find((gap) => gap.Feature === 'Online_Mutation_Application');

  // Build cluster distribution slices for the donut chart
  const counts = profiles.map((profile) => ({
    cluster: profile.Cluster,
    count: profile.State_UT_Count,
    percentage: profile.Cluster_Percentage,
    color: CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B',
  }));

  // Build series for comparison bar chart
  const series = profiles.map((profile) => ({
    key: `cluster${profile.Cluster}`,
    name: `Cluster ${profile.Cluster}`,
    color: CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B',
  }));

  // Focus on 5 key benchmark indicators for the overview comparison
  const keyIndicators = [
    'RoR_Computerization_Pct',
    'Map_Digitization_Pct',
    'Map_RoR_Linkage_Pct',
    'Land_Parcel_ULPIN_Pct',
    'Online_Mutation_Application',
  ].filter((key) => profiles.some((p) => p[key] !== undefined));

  const chartData: ComparisonBarData[] = keyIndicators.map((key) => ({
    indicator: key,
    shortLabel: INDICATOR_METADATA[key]?.shortLabel ?? key,
    cluster0: null,
    cluster1: null,
    clusters: Object.fromEntries(
      profiles.map((profile) => [`cluster${profile.Cluster}`, Number(profile[key] ?? 0)])
    ),
  }));

  // Dynamic summary of distribution based on active configuration
  const dominantCluster = [...profiles].sort((a, b) => b.State_UT_Count - a.State_UT_Count)[0];
  const smallestCluster = [...profiles].sort((a, b) => a.State_UT_Count - b.State_UT_Count)[0];
  const formatMean = (value: number | undefined) => value === undefined || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* 1. Page Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[var(--color-border)]">
        <div>
          <p className="page-subtitle text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
            Compare digital land governance patterns across 36 States and Union Territories.
          </p>
        </div>
      </div>

      {/* Main Governance Visualizations: Distribution & Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Column: Cluster Distribution */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <PieIcon size={16} className="text-blue-600" />
              Cluster Distribution
            </h2>
          <span className="text-xs text-[var(--color-text-tertiary)]">N = {enrichedStates.length} States/UTs</span>
          </div>

          <div className="card-body space-y-3">
            <ClusterDistributionPie clusters={counts} />

            {/* Cluster Size Breakdown Pills */}
            <div className={`grid gap-2 ${counts.length <= 3 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'}`}>
              {counts.map((item) => (
                <div
                  key={item.cluster}
                  className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      Cluster {item.cluster}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)] mt-1 block">
                    {item.count} States/UTs ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Column: Comparative Indicator Benchmark */}
        <div className="card lg:col-span-2 min-w-0">
          <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Core Governance Indicator Comparison
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Cluster average percentages; individual State/UT values may differ.
              </p>
            </div>
            <Link
              to="/clusters"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
            >
              Detailed Cluster Profiles <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card-body">
            <ComparisonBarChart
              data={chartData}
              clusterSeries={series}
              layout="vertical"
              height={280}
            />
          </div>
        </div>
      </div>

      {/* 4. Key Governance Takeaways (3 Clear Findings) */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Key Empirical Takeaways
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)]">Evidence-Based Summary</span>
        </div>

        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Finding 1 */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                Finding 1 · Largest Indicator Gap
              </span>
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1.5">
                {largestGap ? (INDICATOR_METADATA[largestGap.Feature]?.label ?? largestGap.Feature) : 'No comparable indicator data'}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {largestGap
                  ? `The largest observed difference is ${largestGap.Absolute_Gap.toFixed(1)} percentage points between Cluster ${largestGap.Minimum_Cluster} (${formatMean(largestGap.Minimum_Cluster_Mean)}) and Cluster ${largestGap.Maximum_Cluster} (${formatMean(largestGap.Maximum_Cluster_Mean)}). This compares cluster averages in the selected configuration.`
                  : 'The active configuration does not contain a valid cluster-average gap for comparison.'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-tertiary)]">
              {largestGap ? `Largest: ${largestGap.Absolute_Gap.toFixed(1)} pp` : 'Largest gap: unavailable'}
              {mapRorGap ? ` · Map–RoR: ${mapRorGap.Absolute_Gap.toFixed(1)} pp` : ''}
              {ulpinGap ? ` · ULPIN: ${ulpinGap.Absolute_Gap.toFixed(1)} pp` : ''}
            </div>
          </div>

          {/* Finding 2 */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                Finding 2 · Service Indicator Difference
              </span>
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1.5">
                {onlineMutationGap ? (INDICATOR_METADATA[onlineMutationGap.Feature]?.label ?? onlineMutationGap.Feature) : 'No online mutation data'}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {onlineMutationGap
                  ? `Cluster ${onlineMutationGap.Minimum_Cluster} averages ${formatMean(onlineMutationGap.Minimum_Cluster_Mean)} and Cluster ${onlineMutationGap.Maximum_Cluster} averages ${formatMean(onlineMutationGap.Maximum_Cluster_Mean)}. This difference is ${onlineMutationGap.Absolute_Gap.toFixed(1)} percentage points. These are cluster averages, not individual availability rates.`
                  : largestServiceGap
                    ? `${INDICATOR_METADATA[largestServiceGap.Feature]?.label ?? largestServiceGap.Feature} has the largest available service difference at ${largestServiceGap.Absolute_Gap.toFixed(1)} percentage points.`
                    : 'No binary service indicator gap is available for the active configuration.'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-tertiary)]">
              {onlineMutationGap ? `Online Mutation gap: ${onlineMutationGap.Absolute_Gap.toFixed(1)} pp` : largestServiceGap ? `${(INDICATOR_METADATA[largestServiceGap.Feature]?.shortLabel ?? largestServiceGap.Feature)} gap: ${largestServiceGap.Absolute_Gap.toFixed(1)} pp` : 'No service gap available'}
            </div>
          </div>

          {/* Finding 3 */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                Finding 3 · Cluster Distribution
              </span>
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1.5">
                {smallestCluster ? `Cluster ${smallestCluster.Cluster} is the smallest group` : 'Cluster distribution'}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {dominantCluster && smallestCluster
                  ? `Cluster ${dominantCluster.Cluster} contains ${dominantCluster.State_UT_Count} States/UTs (${dominantCluster.Cluster_Percentage.toFixed(1)}% of this dataset); Cluster ${smallestCluster.Cluster} contains ${smallestCluster.State_UT_Count} (${smallestCluster.Cluster_Percentage.toFixed(1)}%). These counts describe membership, while indicator averages describe performance.`
                  : 'Cluster membership is unavailable for the active configuration.'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-tertiary)]">
              All 36 States and UTs represented · Descriptive groups, not rankings
            </div>
          </div>
        </div>
      </div>

      {/* 5. Guided Exploration Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/map"
          className="card p-3.5 hover:border-blue-500 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] block group-hover:text-blue-600">
                Governance Map
              </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">All 36 States/UTs</span>
            </div>
          </div>
          <ArrowRight size={14} className="text-[var(--color-text-tertiary)] group-hover:text-blue-600" />
        </Link>

        <Link
          to="/explorer"
          className="card p-3.5 hover:border-blue-500 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <Search size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] block group-hover:text-emerald-600">
                State Explorer
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Individual Profiles</span>
            </div>
          </div>
          <ArrowRight size={14} className="text-[var(--color-text-tertiary)] group-hover:text-emerald-600" />
        </Link>

        <Link
          to="/clusters"
          className="card p-3.5 hover:border-blue-500 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
              <GitBranch size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] block group-hover:text-purple-600">
                Cluster Intelligence
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Rosters & Profiles</span>
            </div>
          </div>
          <ArrowRight size={14} className="text-[var(--color-text-tertiary)] group-hover:text-purple-600" />
        </Link>

        <Link
          to="/gaps"
          className="card p-3.5 hover:border-blue-500 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] block group-hover:text-amber-600">
                Gap Analysis
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Ranked Divergence</span>
            </div>
          </div>
          <ArrowRight size={14} className="text-[var(--color-text-tertiary)] group-hover:text-amber-600" />
        </Link>
      </div>

      {/* 6. Technical Details & Methodological Guardrails (Progressive Disclosure) */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full card-header flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface-secondary)] transition-colors text-left"
          aria-expanded={showTechnicalDetails}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-blue-600" />
            <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
              Model Validation & Methodological Guardrails
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] font-mono">
              Silhouette: {config.silhouetteScore.toFixed(4)} · DBI: {config.daviesBouldinIndex.toFixed(4)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
            <span>{showTechnicalDetails ? 'Collapse Details' : 'View Specifications'}</span>
            {showTechnicalDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {/* Technical Content Mounted in DOM for Accessibility and Full Verification */}
        <div className={`p-5 space-y-4 border-t border-[var(--color-border)] ${showTechnicalDetails ? 'block' : 'hidden'}`}>
          {/* Mathematical Metric Benchmarks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <span className="text-[11px] text-[var(--color-text-tertiary)] block">Silhouette Score</span>
              <span className="text-base font-bold font-mono text-[var(--color-text-primary)]">
                {config.silhouetteScore.toFixed(4)}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">
                Measures cohesion and separation for this partition; compare with context
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <span className="text-[11px] text-[var(--color-text-tertiary)] block">Davies-Bouldin Index</span>
              <span className="text-base font-bold font-mono text-[var(--color-text-primary)]">
                {config.daviesBouldinIndex.toFixed(4)}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">
                Lower indicates more compact, separated clusters within a comparable analysis
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <span className="text-[11px] text-[var(--color-text-tertiary)] block">WCSS (Inertia)</span>
              <span className="text-base font-bold font-mono text-[var(--color-text-primary)]">
                {config.wcss.toFixed(1)}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">
                Within-cluster squared distances; affected by K and feature space
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <span className="text-[11px] text-[var(--color-text-tertiary)] block">Stability (Mean ARI)</span>
              <span className="text-base font-bold font-mono text-[var(--color-text-primary)]">
                {config.meanARI.toFixed(4)}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">
                {`Across-run assignment agreement; SD ${config.stdARI.toFixed(4)}`}
              </span>
            </div>
          </div>

          {/* Academic Guardrails & Scope Statement */}
          <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs leading-relaxed space-y-2">
            <h4 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Info size={14} className="text-amber-600" />
              Methodological Guardrails & Limitations
            </h4>
            <p className="text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">Categorical Groupings:</strong> Cluster groupings are
              distinct multivariate profiles discovered via K-Means in standardized feature space; they are not hierarchical
              rankings or administrative scorecards.
            </p>
            <p className="text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">Descriptive, Not Causal:</strong> Cluster mean differences
              reflect observed administrative progress metrics from DILRMP data, not causal drivers of state governance efficacy.
            </p>
            <p className="text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">Scope Limitation:</strong> Indicators measure institutional
              digital land records progress. The platform does not directly measure or predict physical land acquisition timelines
              or project-level dispute delays.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <Link
              to="/models"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
            >
              View Model Evaluation Matrix (15 model/K records) →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
