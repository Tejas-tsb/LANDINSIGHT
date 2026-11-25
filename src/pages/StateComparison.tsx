
import { useState, useMemo } from 'react';
import { useData } from '../lib/dataContext';
import { useSelectedClusterData } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ClusterBadge } from '../components/ui/ClusterBadge';
import {
  INDICATOR_METADATA,
  PERCENTAGE_INDICATORS,
  BINARY_INDICATORS,
  RECHARTS_TOOLTIP_PROPS,
} from '../lib/constants';
import { toTitleCase } from '../lib/utils';
import {
  X,
  Check,
} from 'lucide-react';
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

const STATE_PALETTE = ['#2563EB', '#D97706', '#059669', '#7C3AED'];

export default function StateComparison() {
  const { data, isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();

  // Default selected states
  const [selectedStates, setSelectedStates] = useState<string[]>([
    'GUJARAT',
    'NAGALAND',
  ]);

  const [activeTab, setActiveTab] = useState<'percentage' | 'binary'>('percentage');

  // Use states enriched with the currently selected cluster configuration
  const enrichedStates = selected.enrichedStates;

  // Selected state objects
  const selectedStateObjects = useMemo(() => {
    return selectedStates
      .map((name) => enrichedStates.find((s) => s.State_UT === name))
      .filter((s): s is typeof enrichedStates[0] => Boolean(s));
  }, [selectedStates, enrichedStates]);

  // Add state to comparison
  const handleAddState = (stateName: string) => {
    if (selectedStates.length < 4 && !selectedStates.includes(stateName)) {
      setSelectedStates([...selectedStates, stateName]);
    }
  };

  // Remove state from comparison
  const handleRemoveState = (stateName: string) => {
    if (selectedStates.length > 1) {
      setSelectedStates(selectedStates.filter((s) => s !== stateName));
    }
  };

  // Remaining states available to add
  const availableStates = useMemo(() => {
    return enrichedStates.filter((s) => !selectedStates.includes(s.State_UT));
  }, [enrichedStates, selectedStates]);

  // Percentage bar chart data
  const percentageChartData = useMemo(() => {
    return PERCENTAGE_INDICATORS.map((key) => {
      const meta = INDICATOR_METADATA[key];

      const entry: Record<string, string | number | null> = {
        indicator: meta?.shortLabel || key,
      };

      selectedStateObjects.forEach((st) => {
        const val = (st as unknown as Record<string, number | null>)[key];

        entry[toTitleCase(st.State_UT)] =
          val !== null && val !== undefined ? val : null;
      });

      return entry;
    });
  }, [selectedStateObjects]);

  // Loading state
  if (isLoading || selected.isExplorerLoading) {
    return <LoadingState message="Loading state comparison engine..." />;
  }

  // Error state
  if (error || !data) {
    return (
      <ErrorState
        message={error || 'Failed to load data.'}
        onRetry={reload}
      />
    );
  }

  if (selected.explorerError || !selected.config) {
    return (
      <ErrorState
        message={selected.explorerError || 'Failed to load selected cluster configuration.'}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <p className="page-subtitle">
            Compare up to four States/UTs across {selected.config.model} indicators.
          </p>
        </div>
      </div>

      {/* State Selector Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Comparing:
          </span>

          {selectedStateObjects.map((state, index) => (
            <div
              key={state.State_UT}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border"
              style={{
                borderColor: `${STATE_PALETTE[index]}40`,
                backgroundColor: `${STATE_PALETTE[index]}12`,
                color: STATE_PALETTE[index],
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATE_PALETTE[index] }}
              />

              <span>{toTitleCase(state.State_UT)}</span>

              <ClusterBadge cluster={state.Cluster} size="sm" />

              {selectedStates.length > 1 && (
                <button
                  onClick={() => handleRemoveState(state.State_UT)}
                  className="hover:opacity-70 p-0.5"
                  title="Remove"
                  aria-label={`Remove ${toTitleCase(state.State_UT)}`}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}

          {/* Add State Dropdown */}
          {selectedStates.length < 4 && (
            <div className="relative inline-block">
              <select
                aria-label="Add State/UT to comparison"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddState(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-blue-500 cursor-pointer focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  + Add State/UT ({4 - selectedStates.length} remaining)
                </option>

                {availableStates.map((s) => (
                  <option key={s.State_UT} value={s.State_UT}>
                    {toTitleCase(s.State_UT)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Context Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedStateObjects.map((state, idx) => (
          <div
            key={state.State_UT}
            className="card border-t-4"
            style={{ borderTopColor: STATE_PALETTE[idx] }}
          >
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {toTitleCase(state.State_UT)}
                </h3>

                <ClusterBadge cluster={state.Cluster} size="sm" />
              </div>

              <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                <div className="flex justify-between">
                  <span>Districts:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {state.Total_Districts}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Villages:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {state.Total_Villages !== null
                      ? state.Total_Villages.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>RoR Computerization:</span>
                  <span className="font-semibold text-blue-600">
                    {state.RoR_Computerization_Pct !== null
                      ? `${state.RoR_Computerization_Pct.toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Grouped Bar Chart */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Percentage Coverage Indicators Comparison
          </h2>
        </div>

        <div className="card-body">
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={percentageChartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 50 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="indicator"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={65}
                  tick={{
                    fill: 'var(--color-text-secondary)',
                    fontSize: 10,
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: 'var(--color-text-secondary)',
                    fontSize: 11,
                  }}
                  tickFormatter={(v) => `${v}%`}
                />

                <Tooltip
                  formatter={(val: unknown) => [
                    val === null || val === undefined
                      ? 'Unavailable (N/A)'
                      : `${Number(val).toFixed(1)}%`,
                  ]}
                  {...RECHARTS_TOOLTIP_PROPS}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />

                {selectedStateObjects.map((state, idx) => (
                  <Bar
                    key={state.State_UT}
                    dataKey={toTitleCase(state.State_UT)}
                    fill={STATE_PALETTE[idx]}
                    radius={[3, 3, 0, 0]}
                    barSize={14}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Side-by-Side Data Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Indicator-by-Indicator Comparative Matrix
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('percentage')}
              className={`px-2.5 py-1 text-xs rounded font-medium ${
                activeTab === 'percentage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              Percentage Coverage (9)
            </button>

            <button
              onClick={() => setActiveTab('binary')}
              className={`px-2.5 py-1 text-xs rounded font-medium ${
                activeTab === 'binary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              Binary Services (4)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <th className="py-2.5 px-4 font-semibold text-[var(--color-text-primary)]">
                  Indicator Name
                </th>

                {selectedStateObjects.map((state, idx) => (
                  <th
                    key={state.State_UT}
                    className="py-2.5 px-4 font-semibold text-right"
                    style={{ color: STATE_PALETTE[idx] }}
                  >
                    {toTitleCase(state.State_UT)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {activeTab === 'percentage'
                ? PERCENTAGE_INDICATORS.map((key) => {
                    const meta = INDICATOR_METADATA[key];

                    return (
                      <tr
                        key={key}
                        className="hover:bg-[var(--color-surface-tertiary)]/50"
                      >
                        <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">
                          {meta?.label || key}
                        </td>

                        {selectedStateObjects.map((state) => {
                          const val = (
                            state as unknown as Record<string, number | null>
                          )[key];

                          return (
                            <td
                              key={state.State_UT}
                              className="py-2.5 px-4 text-right font-mono font-medium text-[var(--color-text-primary)]"
                            >
                              {val !== null && val !== undefined ? (
                                `${val.toFixed(1)}%`
                              ) : (
                                <span className="text-slate-400 italic">
                                  N/A
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                : BINARY_INDICATORS.map((key) => {
                    const meta = INDICATOR_METADATA[key];

                    return (
                      <tr
                        key={key}
                        className="hover:bg-[var(--color-surface-tertiary)]/50"
                      >
                        <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">
                          {meta?.label || key}
                        </td>

                        {selectedStateObjects.map((state) => {
                          const val = (
                            state as unknown as Record<string, number | null>
                          )[key];

                          return (
                            <td
                              key={state.State_UT}
                              className="py-2.5 px-4 text-right font-medium"
                            >
                              {val === 1 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                  <Check size={12} /> Yes
                                </span>
                              ) : val === 0 ? (
                                <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                                  <X size={12} /> No
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">
                                  Unavailable (N/A)
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
