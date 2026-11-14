import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CLUSTER_CONFIG, RECHARTS_TOOLTIP_PROPS } from '../../lib/constants';

interface ClusterDistributionPieProps {
  cluster0Count: number;
  cluster1Count: number;
}

export function ClusterDistributionPie({
  cluster0Count,
  cluster1Count,
}: ClusterDistributionPieProps) {
  const total = cluster0Count + cluster1Count || 36;
  const data = [
    {
      name: CLUSTER_CONFIG[0].displayName,
      value: cluster0Count,
      percentage: ((cluster0Count / total) * 100).toFixed(1),
      color: CLUSTER_CONFIG[0].color,
    },
    {
      name: CLUSTER_CONFIG[1].displayName,
      value: cluster1Count,
      percentage: ((cluster1Count / total) * 100).toFixed(1),
      color: CLUSTER_CONFIG[1].color,
    },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              `${value} States/UTs (${
                data.find((d) => d.name === name)?.percentage
              }%)`,
              name as string,
            ]}
            {...RECHARTS_TOOLTIP_PROPS}
          />
          <Legend
            verticalAlign="bottom"
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value);
              return (
                <span className="text-xs font-medium text-[var(--color-text-primary)]">
                  {value} ({item?.value} - {item?.percentage}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
