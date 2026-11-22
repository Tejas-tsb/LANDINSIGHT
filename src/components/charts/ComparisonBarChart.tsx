import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CLUSTER_CONFIG, RECHARTS_TOOLTIP_PROPS } from '../../lib/constants';
export interface ComparisonBarData {
  indicator: string; shortLabel: string; cluster0: number | null; cluster1: number | null;
  clusters?: Record<string, number | null>; unit?: string;
}
interface ComparisonBarChartProps { data: ComparisonBarData[]; height?: number; layout?: 'horizontal' | 'vertical'; clusterSeries?: { key: string; name: string; color: string }[] }
export function ComparisonBarChart({ data, height = 360, layout = 'horizontal', clusterSeries }: ComparisonBarChartProps) {
  const series = clusterSeries ?? [
    { key: 'cluster0', name: 'Cluster 0', color: CLUSTER_CONFIG[0].color },
    { key: 'cluster1', name: 'Cluster 1', color: CLUSTER_CONFIG[1].color },
  ];
  const chartData = data.map((row) => ({ ...row, ...(row.clusters ?? {}) }));
  const formatter = (value: unknown, name: unknown) => value === null || value === undefined || isNaN(Number(value)) ? ['Unavailable (N/A)', name as string] : [`${Number(value).toFixed(1)}%`, name as string];
  return <div style={{ width: '100%', height }}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout={layout === 'vertical' ? 'vertical' : 'horizontal'} margin={layout === 'vertical' ? { top: 10, right: 30, left: 110, bottom: 10 } : { top: 15, right: 20, left: 0, bottom: 45 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={layout === 'vertical'} vertical={layout !== 'vertical'} />
    {layout === 'vertical' ? <><XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} /><YAxis type="category" dataKey="shortLabel" tick={{ fill: 'var(--color-text-primary)', fontSize: 11 }} width={100} /></> : <><XAxis dataKey="shortLabel" angle={-30} textAnchor="end" interval={0} height={60} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} /></>}
    <Tooltip formatter={formatter} {...RECHARTS_TOOLTIP_PROPS} /><Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10 }} />
    {series.map((item) => <Bar key={item.key} dataKey={item.key} name={item.name} fill={item.color} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={12} />)}
  </BarChart></ResponsiveContainer></div>;
}
