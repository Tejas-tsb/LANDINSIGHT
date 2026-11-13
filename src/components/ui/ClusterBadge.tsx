import { CLUSTER_CONFIG } from '../../lib/constants';

interface ClusterBadgeProps {
  cluster: number;
  size?: 'sm' | 'md';
}

export function ClusterBadge({ cluster, size = 'sm' }: ClusterBadgeProps) {
  const config = CLUSTER_CONFIG[cluster as keyof typeof CLUSTER_CONFIG];
  if (!config) return null;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {config.displayName}
    </span>
  );
}
