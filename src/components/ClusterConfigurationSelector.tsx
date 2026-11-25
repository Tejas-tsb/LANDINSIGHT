import { useClusterExplorerContext } from '../lib/clusterExplorerContext';
import { useTheme } from '../lib/themeContext';
import { ChevronDown, Layers } from 'lucide-react';

export function ClusterConfigurationSelector() {
  const { explorer, selectedId, setSelectedId, isExplorerLoading, explorerError } = useClusterExplorerContext();
  const { theme } = useTheme();
  if (isExplorerLoading) return <span className="text-xs text-[var(--color-text-tertiary)]">Loading configurations…</span>;
  if (explorerError || !explorer) return <span className="text-xs text-amber-600" title={explorerError ?? ''}>Cluster selector unavailable</span>;
  return (
    <label className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2.5 py-1.5">
      <Layers size={15} className="text-blue-600 shrink-0" />
      <span className="hidden sm:inline text-xs font-medium text-[var(--color-text-secondary)]">Configuration</span>
      <span className="relative flex items-center">
        <select aria-label="Cluster configuration" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} style={{ colorScheme: theme }} className="max-w-[145px] sm:max-w-[190px] appearance-none bg-transparent pr-5 text-xs font-semibold text-[var(--color-text-primary)] outline-none cursor-pointer">
          {explorer.configurations.map((config) => <option key={config.id} value={config.id} style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>{config.model} · K={config.k}{config.id === explorer.defaultConfiguration ? ' (Default)' : ''}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-0 text-[var(--color-text-tertiary)]" />
      </span>
    </label>
  );
}
