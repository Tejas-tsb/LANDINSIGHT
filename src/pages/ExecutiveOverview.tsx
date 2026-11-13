import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { StatCard } from '../components/ui/StatCard';
import { ClusterDistributionPie } from '../components/charts/ClusterDistributionPie';
import { ComparisonBarChart, ComparisonBarData } from '../components/charts/ComparisonBarChart';
import {
  INDICATOR_METADATA,
  PERCENTAGE_INDICATORS,
  BINARY_INDICATORS,
  CLUSTER_CONFIG,
  SELECTED_MODEL,
  SELECTED_K,
} from '../lib/constants';
import {
  Building2,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExecutiveOverview() {
  const { data, isLoading, error, reload } = useData();

  if (isLoading) {
    return <LoadingState message="Loading governance intelligence dataset..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to initialize dataset.'} onRetry={reload} />;
  }

  const { enrichedStates, modelMetrics, clusterProfiles } = data;

  // Selected Model C, K=2 metrics
  const selectedMetric = modelMetrics.find(
    (m) => m.Model === SELECTED_MODEL && m.K === SELECTED_K
  );

  const cluster0States = enrichedStates.filter((s) => s.Cluster === 0);
  const cluster1States = enrichedStates.filter((s) => s.Cluster === 1);

  const c0Profile = clusterProfiles.find((p) => p.Cluster === 0);
  const c1Profile = clusterProfiles.find((p) => p.Cluster === 1);

  // Top 5 percentage coverage indicators for overview chart
  const topIndicators = PERCENTAGE_INDICATORS.slice(0, 5);
  const comparisonData: ComparisonBarData[] = topIndicators.map((key) => {
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

  return (
    <div className="space-y-6">
      {/* Title & Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="page-title">Executive Governance Overview</h1>
          <p className="page-subtitle">
            Unsupervised machine learning analysis of digital land governance across all 36 Indian States and Union Territories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Active Baseline: {SELECTED_MODEL} (K={SELECTED_K})
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total States / UTs"
          value={enrichedStates.length}
          subtitle="Complete national coverage"
          icon={<Building2 size={20} />}
        />
        <StatCard
          label="Clustering Configuration"
          value={`K = ${SELECTED_K}`}
          subtitle={`${SELECTED_MODEL} (13 Features)`}
          icon={<Layers size={20} />}
        />
        <StatCard
          label="Silhouette Score"
          value={selectedMetric ? selectedMetric.Silhouette_Score.toFixed(4) : '0.4076'}
          subtitle="Mean silhouette coefficient (-1 to +1)"
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          trend={{ value: 'Selected configuration: K = 2', positive: true }}
        />
        <StatCard
          label="Davies-Bouldin Index"
          value={selectedMetric ? selectedMetric.Davies_Bouldin_Index.toFixed(4) : '1.1524'}
          subtitle="Cluster separation to scatter ratio (lower indicates better partitioning)"
          icon={<Activity size={20} className="text-blue-600" />}
        />
      </div>

      {/* Cluster Distribution & High-Level Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Distribution Pie */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <PieIcon size={16} className="text-blue-600" />
              Cluster Distribution
            </h2>
            <span className="text-xs text-[var(--color-text-tertiary)]">N = 36 States/UTs</span>
          </div>
          <div className="card-body">
            <ClusterDistributionPie
              cluster0Count={cluster0States.length}
              cluster1Count={cluster1States.length}
            />
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--color-border)] text-xs">
              <div className="p-2.5 rounded bg-[var(--color-surface-tertiary)]">
                <span className="font-semibold text-blue-600 block mb-0.5">
                  {CLUSTER_CONFIG[0].displayName}
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  {cluster0States.length} States/UTs (19.4%)
                </span>
              </div>
              <div className="p-2.5 rounded bg-[var(--color-surface-tertiary)]">
                <span className="font-semibold text-amber-600 block mb-0.5">
                  {CLUSTER_CONFIG[1].displayName}
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  {cluster1States.length} States/UTs (80.6%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Key Indicator Preview */}
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Core Spatial & Record Linkage Coverage (Cluster Means)
            </h2>
            <Link
              to="/clusters"
              className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 font-medium"
            >
              Full intelligence breakdown <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card-body">
            <ComparisonBarChart data={comparisonData} height={260} />
          </div>
        </div>
      </div>

      {/* Analytical Observations & Governance Gap Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Observations */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Key Empirical Observations
            </h2>
          </div>
          <div className="card-body space-y-3 text-sm text-[var(--color-text-secondary)]">
            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
                1. High Adoption Cluster (Cluster 1: 29 Entities)
              </h3>
              <p className="text-xs leading-relaxed">
                Represents 80.6% of Indian States and UTs. Characterized by high baseline RoR Computerization (98.8%),
                Village CLR completion (97.4%), and widespread rollout of digital mutation services (89.7% auto-triggered).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
                2. Developing Digital Foundation (Cluster 0: 7 Entities)
              </h3>
              <p className="text-xs leading-relaxed">
                Includes Arunachal Pradesh, Delhi, Ladakh, Lakshadweep, Meghalaya, Mizoram, and Nagaland.
                Significantly lower Cadastral Map Digitization (51.0%) and RoR Linkage (14.8%), with digitally signed RoR
                availability currently unadopted.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
                3. High Geometric Delineation Gap
              </h3>
              <p className="text-xs leading-relaxed">
                The widest divergence appears in Map-RoR linkage (+52.4 percentage points) and parcel-level
                ULPIN integration (+57.7 percentage points), highlighting parcel linkage as the primary discriminator.
              </p>
            </div>
          </div>
        </div>

        {/* Methodology & Limitations Statement */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-600" />
              Methodological Guardrails & Limitations
            </h2>
          </div>
          <div className="card-body space-y-3 text-sm text-[var(--color-text-secondary)]">
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs leading-relaxed space-y-2">
              <p>
                <strong className="text-[var(--color-text-primary)]">Categorical Groupings:</strong> Cluster 0 and Cluster 1
                are distinct multivariate profiles discovered via K-Means in a 13-dimensional standardized space; they are not
                hierarchical rankings or performance scorecards.
              </p>
              <p>
                <strong className="text-[var(--color-text-primary)]">Descriptive, Not Causal:</strong> Cluster mean differences
                reflect observed administrative progress metrics from DILRMP data, not causal drivers of state governance efficacy.
              </p>
              <p>
                <strong className="text-[var(--color-text-primary)]">Scope Limitation:</strong> Indicators measure institutional
                digital land records progress. The platform does not directly measure or predict physical land acquisition timelines
                or project-level dispute delays.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs">
              <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
                Model C Feature Selection Rationale
              </h3>
              <p className="text-[var(--color-text-tertiary)] leading-relaxed">
                Evaluated against Model A (14 features) and Model B (12 features). Model C excludes the zero-variance/rare
                binary indicator <code className="text-xs font-mono text-blue-600">Auto_Mutation</code> while retaining
                comprehensive spatial coverage, achieving the highest Silhouette Score (0.4076) and perfect cluster stability (ARI = 1.000).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
