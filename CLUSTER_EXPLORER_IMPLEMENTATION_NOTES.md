# LANDINSIGHT — Multi-Cluster Explorer Implementation

## Included

- `public/data/LANDINSIGHT_Cluster_Explorer_Data.json`: corrected Phase 5 data for the four shortlisted configurations, including 144 assignments, 14 profiles, selected evaluation metrics, and 56 governance-gap records.
- `src/lib/clusterExplorerContext.tsx`: loads and validates the experimental dataset, maintains the globally selected configuration, and derives the selected State/UT assignments and cluster means.
- `src/components/ClusterConfigurationSelector.tsx`: shared header selector.
- `src/pages/ExecutiveOverview.tsx`, `GovernanceMap.tsx`, `StateExplorer.tsx`, `ClusterIntelligence.tsx`, `GapAnalysis.tsx`, and `MLModelInsights.tsx`: updated to respond to the shared selection.
- `src/components/charts/ClusterDistributionPie.tsx` and `ComparisonBarChart.tsx`: support dynamic cluster counts and colors.
- `src/lib/constants.ts`: cluster palette extended through Cluster 4; Auto_Mutation metadata retained.

## Data behavior

- Default configuration is `Model_C_K2`.
- The original CSV loader and original production CSV files remain in place.
- The experimental JSON is loaded separately from `/data/LANDINSIGHT_Cluster_Explorer_Data.json`.
- The frontend validates configuration count, assignment count, profile count, governance-gap count, cluster sizes, profile membership, and percentages before exposing the selector.
- Gap ranking values are read from the exported `governanceGaps` records; per-cluster means are displayed from the matching cluster profiles.
- Model B, K=5 shows an interpretability caution for its 2-State/UT cluster.
- No clustering is recomputed in the frontend and no backend is introduced.

## Local verification

From the project root:

```bash
npm ci
npm run build
npm test
npm run dev
```

Then switch through all four configurations and inspect the overview, map, State/UT explorer, cluster profiles, gap analysis, and ML metrics.

## Verification status in the preparation environment

- Experimental JSON structural and cluster-membership checks: passed.
- All four cluster distributions, profile counts, and 14 profile-derived gap magnitudes: passed.
- TypeScript/TSX syntax parsing for all 30 source files: passed.
- Full `npm run build` and Vitest suite: not completed here because `npm ci` repeatedly timed out before installing the project dependencies. The subsequent build attempt therefore failed on missing dependencies/types, not on a confirmed application compilation error.
