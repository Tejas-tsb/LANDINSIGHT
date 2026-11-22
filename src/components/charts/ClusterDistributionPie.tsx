import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CLUSTER_CONFIG, RECHARTS_TOOLTIP_PROPS } from '../../lib/constants';

interface ClusterSlice { cluster: number; count: number; percentage: number; color?: string }
interface ClusterDistributionPieProps {
  cluster0Count?: number; cluster1Count?: number; clusters?: ClusterSlice[];
}
export function ClusterDistributionPie({ cluster0Count = 0, cluster1Count = 0, clusters }: ClusterDistributionPieProps) {
  const source = clusters ?? [
    { cluster: 0, count: cluster0Count, percentage: cluster0Count / (cluster0Count + cluster1Count || 1) * 100 },
    { cluster: 1, count: cluster1Count, percentage: cluster1Count / (cluster0Count + cluster1Count || 1) * 100 },
  ];
  const data = source.map((item) => ({
    name: `Cluster ${item.cluster}`, value: item.count,
    percentage: item.percentage.toFixed(1),
    color: item.color ?? CLUSTER_CONFIG[item.cluster as keyof typeof CLUSTER_CONFIG]?.color ?? '#64748B',
  }));
  return <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><PieChart>
    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
      {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
    </Pie>
    <Tooltip formatter={(value: unknown, name: unknown) => [`${value} States/UTs (${data.find((d) => d.name === name)?.percentage}%)`, name as string]} {...RECHARTS_TOOLTIP_PROPS} />
    <Legend verticalAlign="bottom" formatter={(value: string) => { const item = data.find((d) => d.name === value); return <span className="text-xs font-medium text-[var(--color-text-primary)]">{value} ({item?.value} · {item?.percentage}%)</span>; }} />
  </PieChart></ResponsiveContainer></div>;
}
