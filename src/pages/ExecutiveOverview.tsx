import { useData } from '../lib/dataContext';
import { useSelectedClusterData } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { StatCard } from '../components/ui/StatCard';
import { ClusterDistributionPie } from '../components/charts/ClusterDistributionPie';
import { ComparisonBarChart, ComparisonBarData } from '../components/charts/ComparisonBarChart';
import { INDICATOR_METADATA, PERCENTAGE_INDICATORS, CLUSTER_CONFIG } from '../lib/constants';
import { Building2, PieChart as PieIcon, CheckCircle2, Activity, Layers, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExecutiveOverview() {
  const { data, isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();
  if (isLoading || selected.isExplorerLoading) return <LoadingState message="Loading governance intelligence dataset..." />;
  if (error || selected.explorerError || !data || !selected.config) return <ErrorState message={error || selected.explorerError || 'Failed to initialize dataset.'} onRetry={reload} />;
  const { config, enrichedStates, profiles } = selected;
  const counts = profiles.map((profile) => ({ cluster: profile.Cluster, count: profile.State_UT_Count, percentage: profile.Cluster_Percentage, color: CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG].color }));
  const series = profiles.map((profile) => ({ key: `cluster${profile.Cluster}`, name: `Cluster ${profile.Cluster}`, color: CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG].color }));
  const chartData: ComparisonBarData[] = PERCENTAGE_INDICATORS.slice(0, 5).map((key) => ({ indicator: key, shortLabel: INDICATOR_METADATA[key]?.shortLabel ?? key, cluster0: null, cluster1: null, clusters: Object.fromEntries(profiles.map((profile) => [`cluster${profile.Cluster}`, Number(profile[key] ?? 0)])) }));
  return <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]"><div><h1 className="page-title">Executive Governance Overview</h1><p className="page-subtitle">Unsupervised machine learning analysis of digital land governance across all 36 Indian States and Union Territories.</p></div><span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Active Baseline: {config.model} (K={config.k})</span></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total States / UTs" value={enrichedStates.length} subtitle="Complete national coverage" icon={<Building2 size={20} />} />
      <StatCard label="Clustering Configuration" value={`K = ${config.k}`} subtitle={`${config.model} · ${config.featureCount} features`} icon={<Layers size={20} />} />
      <StatCard label="Silhouette Score" value={config.silhouetteScore.toFixed(4)} subtitle="Higher indicates better separation" icon={<CheckCircle2 size={20} className="text-emerald-600" />} />
      <StatCard label="Davies-Bouldin Index" value={config.daviesBouldinIndex.toFixed(4)} subtitle="Lower indicates better separation" icon={<Activity size={20} className="text-blue-600" />} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card"><div className="card-header flex items-center justify-between"><h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><PieIcon size={16} className="text-blue-600" />Cluster Distribution</h2><span className="text-xs text-[var(--color-text-tertiary)]">N = 36 States/UTs</span></div><div className="card-body"><ClusterDistributionPie clusters={counts} /><div className="grid grid-cols-2 gap-2 mt-3">{counts.map((item) => <div key={item.cluster} className="p-2.5 rounded bg-[var(--color-surface-tertiary)]"><span className="text-xs font-semibold block" style={{ color: item.color }}>Cluster {item.cluster}</span><span className="text-xs text-[var(--color-text-secondary)]">{item.count} States/UTs ({item.percentage.toFixed(1)}%)</span></div>)}</div></div></div>
      <div className="card lg:col-span-2"><div className="card-header"><h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Governance Indicator Comparison</h2><p className="text-xs text-[var(--color-text-secondary)]">Cluster means for selected configuration · percentage values</p></div><div className="card-body"><ComparisonBarChart data={chartData} clusterSeries={series} layout="vertical" height={360} /></div></div>
    </div>
    {config.id === 'Model_B_K5' && <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex gap-3"><ShieldAlert className="text-amber-600 shrink-0" size={19}/><div className="text-xs text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text-primary)]">Small-cluster caution:</strong> Model B, K=5 includes a cluster containing only 2 States/UTs (5.6%). Interpret its profile cautiously.</div></div>}
    <div className="card"><div className="card-header"><h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><ShieldAlert size={16} className="text-amber-600" />Methodological Guardrails & Limitations</h2></div><div className="card-body space-y-3 text-sm text-[var(--color-text-secondary)]"><div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs leading-relaxed space-y-2"><p><strong className="text-[var(--color-text-primary)]">Categorical Groupings:</strong> Cluster groupings are distinct multivariate profiles discovered via K-Means; they are not hierarchical rankings or performance scorecards.</p><p><strong className="text-[var(--color-text-primary)]">Descriptive, Not Causal:</strong> Cluster mean differences reflect observed administrative progress metrics from DILRMP data, not causal drivers of state governance efficacy.</p><p><strong className="text-[var(--color-text-primary)]">Scope Limitation:</strong> Indicators measure institutional digital land records progress. The platform does not directly measure or predict physical land acquisition timelines or project-level dispute delays.</p></div></div></div>
    <div className="card"><div className="card-header"><h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Explore the selected configuration</h2></div><div className="card-body flex flex-wrap gap-3 text-sm"><Link className="text-blue-600 hover:underline" to="/map">Governance Map →</Link><Link className="text-blue-600 hover:underline" to="/explorer">State/UT Explorer →</Link><Link className="text-blue-600 hover:underline" to="/clusters">Cluster Intelligence →</Link><Link className="text-blue-600 hover:underline" to="/gaps">Governance Gap Analysis →</Link><Link className="text-blue-600 hover:underline" to="/models">Model Evaluation →</Link></div></div>
  </div>;
}
