import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { EnrichedStateData, StateGovernanceData } from '../types/data';
import { useData } from './dataContext';

export interface ClusterExplorerConfiguration {
  id: string; model: string; k: number; featureCount: number; wcss: number;
  silhouetteScore: number; daviesBouldinIndex: number; meanARI: number; stdARI: number;
  clusterDistribution: Record<string, number>;
}
export interface ExplorerAssignment { Model: string; K: number; State_UT: string; Cluster: number; Config_ID: string }
export interface ExplorerProfile {
  Model: string; K: number; Cluster: number; State_UT_Count: number; Cluster_Percentage: number;
  State_UTs: string; Config_ID: string; [key: string]: string | number;
}
export interface ExplorerGap {
  Feature: string; Category: string; Absolute_Gap: number; Gap_Rank: number;
  Minimum_Cluster_Mean: number; Maximum_Cluster_Mean: number;
  Minimum_Cluster: number; Maximum_Cluster: number;
  clusterMeans: { cluster: number; mean: number }[];
}
export interface ExplorerGapRecord {
  Model: string; K: number; Config_ID: string; Indicator: string; Category: string;
  Minimum_Cluster_Mean: number; Maximum_Cluster_Mean: number; Absolute_Gap: number; Gap_Rank: number;
}
export interface ClusterExplorerFile {
  project: string; version: number; defaultConfiguration: string;
  configurations: ClusterExplorerConfiguration[];
  assignments: ExplorerAssignment[]; profiles: ExplorerProfile[];
  governanceGaps: ExplorerGapRecord[];
}
interface ContextValue {
  explorer: ClusterExplorerFile | null; selectedId: string; setSelectedId: (id: string) => void;
  isExplorerLoading: boolean; explorerError: string | null;
}
const ClusterExplorerContext = createContext<ContextValue | undefined>(undefined);

export function ClusterExplorerProvider({ children }: { children: React.ReactNode }) {
  const [explorer, setExplorer] = useState<ClusterExplorerFile | null>(null);
  const [selectedId, setSelectedId] = useState('Model_C_K2');
  const [isExplorerLoading, setIsExplorerLoading] = useState(true);
  const [explorerError, setExplorerError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/data/LANDINSIGHT_Cluster_Explorer_Data.json')
      .then((response) => { if (!response.ok) throw new Error(`Cluster Explorer data request failed (${response.status})`); return response.json(); })
      .then((json: ClusterExplorerFile) => {
        if (json.project !== 'LANDINSIGHT' || json.configurations?.length !== 4 || json.assignments?.length !== 144 || json.profiles?.length !== 14 || json.governanceGaps?.length !== 56) {
          throw new Error('Cluster Explorer dataset failed structural validation. Expected 4 configurations, 144 assignments, 14 profiles and 56 governance-gap records.');
        }
        if (!json.configurations.some((item) => item.id === json.defaultConfiguration)) throw new Error('Default Cluster Explorer configuration is missing.');
        for (const config of json.configurations) {
          const assignments = json.assignments.filter((row) => row.Config_ID === config.id);
          const profiles = json.profiles.filter((row) => row.Config_ID === config.id);
          const gaps = json.governanceGaps.filter((row) => row.Config_ID === config.id);
          const counts = new Map<number, number>();
          assignments.forEach((row) => counts.set(row.Cluster, (counts.get(row.Cluster) ?? 0) + 1));
          if (assignments.length !== 36 || new Set(assignments.map((row) => row.State_UT.trim().toUpperCase())).size !== 36 || profiles.length !== config.k || gaps.length !== 14 || counts.size !== config.k) {
            throw new Error(`Cluster Explorer validation failed for ${config.id}.`);
          }
          for (let cluster = 0; cluster < config.k; cluster += 1) {
            const count = counts.get(cluster) ?? 0;
            const profile = profiles.find((row) => row.Cluster === cluster);
            if (!profile || count !== config.clusterDistribution[String(cluster)] || profile.State_UT_Count !== count || Math.abs(profile.Cluster_Percentage - count / 36 * 100) > 1e-8) {
              throw new Error(`Cluster size/profile mismatch in ${config.id}, cluster ${cluster}.`);
            }
            const assignedNames = assignments.filter((row) => row.Cluster === cluster).map((row) => row.State_UT.trim().toUpperCase()).sort();
            const profiledNames = profile.State_UTs.split(',').map((name) => name.trim().toUpperCase()).sort();
            if (assignedNames.join('|') !== profiledNames.join('|')) throw new Error(`State membership mismatch in ${config.id}, cluster ${cluster}.`);
          }
        }
        if (!cancelled) { setExplorer(json); setSelectedId(json.defaultConfiguration); }
      })
      .catch((error: unknown) => { if (!cancelled) setExplorerError(error instanceof Error ? error.message : 'Unable to load Cluster Explorer data.'); })
      .finally(() => { if (!cancelled) setIsExplorerLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return <ClusterExplorerContext.Provider value={{ explorer, selectedId, setSelectedId, isExplorerLoading, explorerError }}>{children}</ClusterExplorerContext.Provider>;
}
export function useClusterExplorerContext() {
  const context = useContext(ClusterExplorerContext);
  if (!context) throw new Error('useClusterExplorerContext must be used within ClusterExplorerProvider');
  return context;
}

export function useSelectedClusterData() {
  const { data } = useData();
  const context = useClusterExplorerContext();
  return useMemo(() => {
    const { explorer, selectedId } = context;
    if (!data || !explorer) return { ...context, config: undefined, enrichedStates: [] as EnrichedStateData[], profiles: [] as ExplorerProfile[], assignments: [] as ExplorerAssignment[], gaps: [] as ExplorerGap[] };
    const config = explorer.configurations.find((item) => item.id === selectedId) ?? explorer.configurations[0];
    const assignments = explorer.assignments.filter((row) => row.Config_ID === config.id);
    const profiles = explorer.profiles.filter((row) => row.Config_ID === config.id).sort((a, b) => a.Cluster - b.Cluster);
    const assignmentMap = new Map(assignments.map((row) => [row.State_UT.trim().toUpperCase(), row]));
    const enrichedStates = data.states.map((state: StateGovernanceData) => {
      const assignment = assignmentMap.get(state.State_UT.trim().toUpperCase());
      if (!assignment) throw new Error(`Missing ${config.id} assignment for ${state.State_UT}`);
      return { ...state, Cluster: assignment.Cluster, Cluster_Size: config.clusterDistribution[String(assignment.Cluster)], Cluster_Percentage: config.clusterDistribution[String(assignment.Cluster)] / 36 * 100 };
    });
    const featureKeys = explorer.governanceGaps.filter((row) => row.Config_ID === config.id).map((row) => row.Indicator);
    const gaps: ExplorerGap[] = featureKeys.map((feature) => {
      const clusterMeans = profiles.map((profile) => ({ cluster: profile.Cluster, mean: Number(profile[feature] ?? 0) }));
      const sorted = [...clusterMeans].sort((a, b) => a.mean - b.mean);
      const exportedGap = explorer.governanceGaps.find((row) => row.Config_ID === config.id && row.Indicator === feature);
      return { Feature: feature, Category: exportedGap?.Category ?? (['Online_RoR_Download','Digitally_Signed_RoR','Online_Mutation_Application','Auto_Triggered_Mutation','Auto_Mutation'].includes(feature) ? 'Binary Adoption' : 'Percentage Coverage'), Absolute_Gap: exportedGap?.Absolute_Gap ?? (sorted[sorted.length - 1].mean - sorted[0].mean), Gap_Rank: exportedGap?.Gap_Rank ?? 0, Minimum_Cluster_Mean: exportedGap?.Minimum_Cluster_Mean ?? sorted[0].mean, Maximum_Cluster_Mean: exportedGap?.Maximum_Cluster_Mean ?? sorted[sorted.length - 1].mean, Minimum_Cluster: sorted[0].cluster, Maximum_Cluster: sorted[sorted.length - 1].cluster, clusterMeans };
    }).sort((a, b) => a.Gap_Rank - b.Gap_Rank);
    return { ...context, config, enrichedStates, profiles, assignments, gaps };
  }, [data, context.explorer, context.selectedId, context.setSelectedId, context.isExplorerLoading, context.explorerError]);
}
