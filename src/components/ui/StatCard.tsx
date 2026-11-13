import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}

export function StatCard({ label, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="stat-label">{label}</p>
            <p className="stat-value mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{subtitle}</p>
            )}
            {trend && (
              <p
                className={`text-xs font-medium mt-1.5 ${
                  trend.positive ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-text-tertiary)]'
                }`}
              >
                {trend.value}
              </p>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)] flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
