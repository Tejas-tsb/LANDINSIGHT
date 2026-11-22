import { useData } from '../lib/dataContext';
import { useSelectedClusterData } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ComparisonBarChart, ComparisonBarData } from '../components/charts/ComparisonBarChart';
import { INDICATOR_METADATA, PERCENTAGE_INDICATORS, BINARY_INDICATORS, CLUSTER_CONFIG } from '../lib/constants';
import { toTitleCase } from '../lib/utils';
import { ShieldAlert } from 'lucide-react';

export default function ClusterIntelligence() {
  const { isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();
  if (isLoading || selected.isExplorerLoading) return <LoadingState message="Loading cluster profile intelligence..." />;
  if (error || selected.explorerError || !selected.config) return <ErrorState message={error || selected.explorerError || 'Failed to load cluster data.'} onRetry={reload} />;
  const { config, profiles, enrichedStates } = selected;
  const series = profiles.map((profile) => ({ key: `cluster${profile.Cluster}`, name: `Cluster ${profile.Cluster}`, color: CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG].color }));
  const buildChart = (keys: string[]): ComparisonBarData[] => keys.map((key) => ({ indicator: key, shortLabel: INDICATOR_METADATA[key]?.shortLabel ?? key, cluster0: null, cluster1: null, clusters: Object.fromEntries(profiles.map((profile) => [`cluster${profile.Cluster}`, Number(profile[key] ?? 0)])) }));

  const isK2 = profiles.length === 2;

  return <div className="space-y-6">
    <div className="pb-3 border-b border-[var(--color-border)]"><h1 className="page-title">Cluster Intelligence & Profiles</h1><p className="page-subtitle">Explore the {config.k} empirical clusters identified by {config.model} using {config.featureCount} features.</p></div>
    {config.id === 'Model_B_K5' && <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-3 flex gap-2 text-xs text-[var(--color-text-secondary)]"><ShieldAlert size={17} className="text-amber-600 shrink-0"/><span><strong className="text-[var(--color-text-primary)]">Interpretability caution:</strong> Cluster 1 contains only 2 States/UTs (5.6% of the dataset); its profile may be sensitive to individual observations.</span></div>}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{profiles.map((profile) => {
      const members = enrichedStates.filter((state) => state.Cluster === profile.Cluster);
      const color = CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG].color;
      return <section key={profile.Cluster} className="card border-l-4" style={{ borderLeftColor: color }}><div className="card-header flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}/><h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
  {config.id === 'Model_C_K2'
    ? profile.Cluster === 0
      ? 'Cluster 0 — Foundation & Nascent Digital Infrastructure'
      : profile.Cluster === 1
      ? 'Cluster 1 — High Digitization & Automated Services'
      : `Cluster ${profile.Cluster}`
    : `Cluster ${profile.Cluster}`}
</h2></div><span className="text-xs text-[var(--color-text-secondary)]">{profile.State_UT_Count} States/UTs ({profile.Cluster_Percentage.toFixed(1)}%)</span></div><div className="card-body"><p className="text-xs text-[var(--color-text-secondary)] mb-3">{members.length} assigned States/UTs</p><div className="flex flex-wrap gap-1.5">{members.map((state) => <span key={state.State_UT} className="text-xs px-2 py-1 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">{toTitleCase(state.State_UT)}</span>)}</div></div></section>;
    })}</div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><section className="card"><div className="card-header"><h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Cadastral & Spatial Coverage (% Means)</h2><p className="text-xs text-[var(--color-text-secondary)]">Cluster-level means across nine indicators</p></div><div className="card-body"><ComparisonBarChart data={buildChart(PERCENTAGE_INDICATORS)} clusterSeries={series} layout="vertical" height={430}/></div></section><section className="card"><div className="card-header"><h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Citizen Service Adoption (% Available)</h2><p className="text-xs text-[var(--color-text-secondary)]">Cluster-level availability percentages</p></div><div className="card-body"><ComparisonBarChart data={buildChart(BINARY_INDICATORS)} clusterSeries={series} layout="vertical" height={430}/></div></section></div>
    <section className="card"><div className="card-header"><h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Comprehensive Cluster Means & Differential Breakdown</h2><p className="text-xs text-[var(--color-text-secondary)]">All 14 governance indicator averages · percentages</p></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-[var(--color-surface-secondary)] text-left"><th className="p-3">Indicator</th>{profiles.map((p) => <th key={p.Cluster} className="p-3 text-right">Cluster {p.Cluster}</th>)}{isK2 && <th className="p-3 text-right">Difference (C1 - C0)</th>}<th className="p-3 text-right">Absolute Gap</th></tr></thead><tbody className="divide-y divide-[var(--color-border)]">{[...PERCENTAGE_INDICATORS, ...BINARY_INDICATORS].map((key) => {
      const means = profiles.map((p) => Number(p[key] ?? 0));
      const minMean = Math.min(...means);
      const maxMean = Math.max(...means);
      const gap = maxMean - minMean;
      const diff = isK2 ? means[1] - means[0] : 0;
      return <tr key={key}><td className="p-3 text-[var(--color-text-primary)]">{INDICATOR_METADATA[key]?.label ?? key}</td>{profiles.map((p) => <td key={p.Cluster} className="p-3 text-right font-mono text-[var(--color-text-secondary)]">{Number(p[key] ?? 0).toFixed(1)}%</td>)}{isK2 && <td className="p-3 text-right font-mono text-[var(--color-text-secondary)]">{diff >= 0 ? '+' : ''}{diff.toFixed(1)} pp</td>}<td className="p-3 text-right font-mono font-semibold text-[var(--color-text-primary)]">{gap.toFixed(1)} pp</td></tr>;
    })}</tbody></table></div></section>
  </div>;
}
