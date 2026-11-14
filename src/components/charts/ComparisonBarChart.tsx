import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CLUSTER_CONFIG, RECHARTS_TOOLTIP_PROPS } from '../../lib/constants';

export interface ComparisonBarData {
  indicator: string;
  shortLabel: string;
  cluster0: number | null;
  cluster1: number | null;
  unit?: string;
}

interface ComparisonBarChartProps {
  data: ComparisonBarData[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
}

export function ComparisonBarChart({
  data,
  height = 360,
  layout = 'horizontal',
}: ComparisonBarChartProps) {
  const tooltipFormatter = (value: unknown, name: unknown) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return ['Unavailable (N/A)', name as string];
    }
    return [`${Number(value).toFixed(1)}%`, name as string];
  };

  if (layout === 'vertical') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 110, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="shortLabel"
              tick={{ fill: 'var(--color-text-primary)', fontSize: 11 }}
              width={100}
            />
            <Tooltip
              formatter={tooltipFormatter}
              {...RECHARTS_TOOLTIP_PROPS}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            <Bar
              dataKey="cluster0"
              name={CLUSTER_CONFIG[0].displayName}
              fill={CLUSTER_CONFIG[0].color}
              radius={[0, 4, 4, 0]}
              barSize={12}
            />
            <Bar
              dataKey="cluster1"
              name={CLUSTER_CONFIG[1].displayName}
              fill={CLUSTER_CONFIG[1].color}
              radius={[0, 4, 4, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 15, right: 20, left: 0, bottom: 45 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="shortLabel"
            angle={-30}
            textAnchor="end"
            interval={0}
            height={60}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={tooltipFormatter}
            {...RECHARTS_TOOLTIP_PROPS}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px' }}
          />
          <Bar
            dataKey="cluster0"
            name={CLUSTER_CONFIG[0].displayName}
            fill={CLUSTER_CONFIG[0].color}
            radius={[4, 4, 0, 0]}
            barSize={16}
          />
          <Bar
            dataKey="cluster1"
            name={CLUSTER_CONFIG[1].displayName}
            fill={CLUSTER_CONFIG[1].color}
            radius={[4, 4, 0, 0]}
            barSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
