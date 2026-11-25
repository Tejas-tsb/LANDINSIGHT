import fs from 'fs';
import path from 'path';
import { ClusterExplorerProvider } from '../lib/clusterExplorerContext';
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../lib/themeContext';
import { DataProvider } from '../lib/dataContext';
import { AppLayout } from '../components/layout/AppLayout';

import ExecutiveOverview from './ExecutiveOverview';
import GovernanceMap from './GovernanceMap';
import StateExplorer from './StateExplorer';
import ClusterIntelligence from './ClusterIntelligence';
import IndicatorAnalytics from './IndicatorAnalytics';
import StateComparison from './StateComparison';
import GapAnalysis from './GapAnalysis';
import MLModelInsights from './MLModelInsights';
import ReportsDownloads from './ReportsDownloads';

// Polyfill ResizeObserver for Recharts ResponsiveContainer in JSDOM
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Polyfill window.matchMedia for ThemeProvider in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Helper to provide Data & Theme Context wrapped in a MemoryRouter
function renderWithContext(
  ui: React.ReactElement,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  return render(
  <ThemeProvider>
    <DataProvider>
      <ClusterExplorerProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<ExecutiveOverview />} />
              <Route path="/map" element={<GovernanceMap />} />
              <Route path="/explorer" element={<StateExplorer />} />
              <Route path="/clusters" element={<ClusterIntelligence />} />
              <Route path="/indicators" element={<IndicatorAnalytics />} />
              <Route path="/comparison" element={<StateComparison />} />
              <Route path="/gaps" element={<GapAnalysis />} />
              <Route path="/models" element={<MLModelInsights />} />
              <Route path="/reports" element={<ReportsDownloads />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ClusterExplorerProvider>
    </DataProvider>
  </ThemeProvider>
);
}

describe('Dashboard Functional Testing — All 9 Pages & Interactive Elements', () => {
  beforeEach(() => {
    // Adapter that reads actual files from public directory on disk
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const cleanPath = url.replace(/^\//, '');
      const filePath = path.resolve(process.cwd(), 'public', cleanPath);
      if (!fs.existsSync(filePath)) {
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
      }
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (cleanPath.endsWith('.geojson') || cleanPath.endsWith('.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => JSON.parse(fileContent),
          text: async () => fileContent,
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => fileContent,
      });
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Executive Overview (Route: /)
  // =========================================================================
  describe('Page 1: Executive Overview (/)', () => {
    it('renders the baseline overview without a KPI card row and keeps core analysis prominent', async () => {
      renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });

      // Wait for data load
      await waitFor(() => {
        expect(screen.queryByText(/Loading governance intelligence dataset/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Executive Overview' })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('combobox', { name: /cluster configuration/i })).toHaveValue('Model_C_K2');

      // The redundant summary-card row is removed; scope remains available in the analysis.
      expect(screen.queryByText('Total States / UTs')).not.toBeInTheDocument();
      expect(screen.queryByText('Clustering Configuration')).not.toBeInTheDocument();
      expect(screen.queryByText('Largest Cluster Size')).not.toBeInTheDocument();
      expect(screen.queryByText('Smallest Cluster Size')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Cluster Distribution/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Core Governance Indicator Comparison/i })).toBeInTheDocument();
      expect(screen.queryByText(/Smallest-cluster note/i)).not.toBeInTheDocument();
      const comparisonCard = screen.getByRole('heading', { name: /Core Governance Indicator Comparison/i }).closest('.card');
      expect(comparisonCard?.querySelector('[style*="height: 280px"]')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Digitally Signed RoR/i })).toBeInTheDocument();
      expect(screen.getByText(/Largest: 82\.8 pp/)).toBeInTheDocument();
      expect(screen.getByText(/Map–RoR: 52\.4 pp · ULPIN: 57\.7 pp/i)).toBeInTheDocument();
      expect(screen.getByText(/Online Mutation gap: 71\.9 pp/i)).toBeInTheDocument();
      expect(screen.getByText(/Cluster 0 averages 14\.3% and Cluster 1 averages 86\.2%/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /View Specifications/i }));
      expect(screen.getByText('Silhouette Score')).toBeInTheDocument();
      expect(screen.getByText('0.4076')).toBeInTheDocument();
      expect(screen.getByText('Davies-Bouldin Index')).toBeInTheDocument();
      expect(screen.getByText('1.1524')).toBeInTheDocument();

      // Verify Cluster Distribution values
      expect(screen.getByText('7 States/UTs (19.4%)')).toBeInTheDocument();
      expect(screen.getByText('29 States/UTs (80.6%)')).toBeInTheDocument();

      // Verify Methodological Guardrails
      expect(screen.getByText(/Methodological Guardrails & Limitations/i)).toBeInTheDocument();
    });

    it('dynamically updates overview findings, metrics, and distribution across all 4 cluster configurations', async () => {
      renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading governance intelligence dataset/i)).not.toBeInTheDocument();
      });

      const selector = screen.getByRole('combobox', { name: /cluster configuration/i });
      expect(selector).toBeInTheDocument();

      // Test Model B K=3
      fireEvent.change(selector, { target: { value: 'Model_B_K3' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_B_K3');
        expect(selector).toHaveValue('Model_B_K3');
        expect(screen.getAllByRole('heading', { name: /Online Mutation Application/i }).length).toBeGreaterThan(0);
        expect(screen.getByText(/Largest: 100\.0 pp/)).toBeInTheDocument();
        expect(screen.queryByText(/Map–RoR: 52\.4 pp · ULPIN: 57\.7 pp/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Online Mutation gap: 100\.0 pp/i)).toBeInTheDocument();
        expect(screen.queryByText(/Cluster 0 averages 14\.3% and Cluster 1 averages 86\.2%/i)).not.toBeInTheDocument();
      });

      fireEvent.change(selector, { target: { value: 'Model_B_K4' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_B_K4');
        expect(selector).toHaveValue('Model_B_K4');
      });

      // Test Model B K=5 without a repeated smallest-cluster warning banner.
      fireEvent.change(selector, { target: { value: 'Model_B_K5' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_B_K5');
        expect(selector).toHaveValue('Model_B_K5');
        expect(screen.queryByText(/Smallest-cluster note/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Cluster 1 contains 2 \(5\.6%\)/i)).toBeInTheDocument();
        expect(screen.getAllByRole('heading', { name: /Online RoR Download/i }).length).toBeGreaterThan(0);
        expect(screen.getByText(/Largest: 100\.0 pp/)).toBeInTheDocument();
      });

      // Switch back to Model C K=2 (Default)
      fireEvent.change(selector, { target: { value: 'Model_C_K2' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_C_K2');
        expect(selector).toHaveValue('Model_C_K2');
      });
    });
  });

  // =========================================================================
  // 2. Governance Map (Route: /map)
  // =========================================================================
  describe('Page 2: Governance Map (/map)', () => {
    it('renders national map controls, cluster legend, and detail inspection panel', async () => {
      renderWithContext(<GovernanceMap />, { initialEntries: ['/map'] });

      await waitFor(() => {
        expect(screen.queryByText(/Rendering interactive geospatial intelligence map/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Governance Map' })).toBeInTheDocument();

      // Verify Cluster Filter Controls
      expect(screen.getByRole('button', { name: /All \(36\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cluster 0 \(7\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cluster 1 \(29\)/i })).toBeInTheDocument();

      // Verify Cluster Legend Overlay
      expect(screen.getByText('Cluster Legend')).toBeInTheDocument();
      expect(screen.getByText(/Cluster 0 \(7 States\/UTs, 19\.4%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Cluster 1 \(29 States\/UTs, 80\.6%\)/i)).toBeInTheDocument();

      // Verify active state side panel displays metrics (default first state: Andaman & Nicobar or Andhra Pradesh)
      expect(screen.getByText(/Core Digitization Progress/i)).toBeInTheDocument();
      expect(screen.getByText(/Digital Citizen Services/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Open in State Explorer/i })).toBeInTheDocument();

      // Interactive filter button test
      fireEvent.click(screen.getByRole('button', { name: /Cluster 0 \(7\)/i }));
      fireEvent.click(screen.getByRole('button', { name: /Cluster 1 \(29\)/i }));
      fireEvent.click(screen.getByRole('button', { name: /All \(36\)/i }));
    });
  });

  // =========================================================================
  // 3. State / UT Explorer (Route: /explorer)
  // =========================================================================
  describe('Page 3: State / UT Explorer (/explorer)', () => {
    it('renders searchable state directory, radar comparison, and benchmark table', async () => {
      renderWithContext(<StateExplorer />, { initialEntries: ['/explorer'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading State\/UT profiles/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'State/UT Explorer' })).toBeInTheDocument();

      // Search bar interaction
      const searchInput = screen.getByPlaceholderText(/Search 36 States and UTs/i);
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: 'Gujarat' } });

      // Only Gujarat should appear in the filtered list
      expect(screen.getByText('Gujarat')).toBeInTheDocument();
      expect(screen.queryByText('Assam')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Cluster filter buttons interaction
      const c0Btn = screen.getByRole('button', { name: /Cluster 0 \(7\)/i });
      fireEvent.click(c0Btn);
      expect(screen.getByText('Delhi')).toBeInTheDocument();
      expect(screen.getByText('Nagaland')).toBeInTheDocument();
      expect(screen.queryByText('Gujarat')).not.toBeInTheDocument();

      // Reset to all
      const allBtn = screen.getByRole('button', { name: /All \(36\)/i });
      fireEvent.click(allBtn);

      // Verify Indicator Breakdown & Cluster Benchmark Table
      expect(screen.getByText(/Indicator Breakdown & Cluster Benchmark/i)).toBeInTheDocument();
      expect(screen.getByText('Map Digitization')).toBeInTheDocument();
      expect(screen.getByText('RoR Computerization')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. Cluster Intelligence (Route: /clusters)
  // =========================================================================
  describe('Page 4: Cluster Intelligence (/clusters)', () => {
    it('renders Cluster 0 vs Cluster 1 deep-dive cards and comprehensive comparative table', async () => {
      renderWithContext(<ClusterIntelligence />, { initialEntries: ['/clusters'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading cluster profile intelligence/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Cluster Intelligence' })).toBeInTheDocument();

      // Check Cluster 0 Profile Card
      expect(screen.getByRole('heading', { name: 'Cluster 0' })).toBeInTheDocument();
      expect(screen.getByText(/7 States\/UTs \(19\.4%\)/i)).toBeInTheDocument();

      // Check Cluster 1 Profile Card
      expect(screen.getByRole('heading', { name: 'Cluster 1' })).toBeInTheDocument();
      expect(screen.getByText(/29 States\/UTs \(80\.6%\)/i)).toBeInTheDocument();

      // Check member expansion toggle for Cluster 1 (29 members > 8 limit)
      const expandBtn = screen.getByRole('button', { name: /\+21 more/i });
      expect(expandBtn).toBeInTheDocument();
      fireEvent.click(expandBtn);
      expect(screen.getByRole('button', { name: /Show less/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Show less/i }));
      expect(screen.getByRole('button', { name: /\+21 more/i })).toBeInTheDocument();

      // Check Comparative Chart Headers
      expect(screen.getByText(/Cadastral & Spatial Coverage \(% Means\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Citizen Service Adoption \(% Available\)/i)).toBeInTheDocument();

      // Check Metric Comparison Table
      expect(screen.getByText(/Comprehensive Cluster Means & Differential Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText('Difference (C1 - C0)')).toBeInTheDocument();
      expect(screen.getByText('Absolute Gap')).toBeInTheDocument();

      // Test Table collapse / expand toggle
      const collapseTableBtn = screen.getByRole('button', { name: /Collapse Table/i });
      fireEvent.click(collapseTableBtn);
      expect(screen.queryByText('Difference (C1 - C0)')).not.toBeInTheDocument();
      const expandTableBtn = screen.getByRole('button', { name: /Expand Full Matrix/i });
      fireEvent.click(expandTableBtn);
      expect(screen.getByText('Difference (C1 - C0)')).toBeInTheDocument();
    });

    it('dynamically adapts cluster profiles, headers, and spread metrics across all 4 configurations', async () => {
      renderWithContext(<ClusterIntelligence />, { initialEntries: ['/clusters'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading cluster profile intelligence/i)).not.toBeInTheDocument();
      });

      const selector = screen.getByRole('combobox', { name: /cluster configuration/i });
      expect(selector).toBeInTheDocument();

      // 1. Switch to Model B K=3
      fireEvent.change(selector, { target: { value: 'Model_B_K3' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_B_K3');
        expect(screen.getByText('Spread (Max - Min)')).toBeInTheDocument();
        expect(screen.queryByText('Difference (C1 - C0)')).not.toBeInTheDocument();
      });

      // 2. Switch to Model B K=4
      fireEvent.change(selector, { target: { value: 'Model_B_K4' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_B_K4');
        expect(screen.getByText('Spread (Max - Min)')).toBeInTheDocument();
        expect(screen.queryByText('Difference (C1 - C0)')).not.toBeInTheDocument();
      });

      // 3. Switch to Model B K=5 without a repeated warning banner.
      fireEvent.change(selector, { target: { value: 'Model_B_K5' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_B_K5');
        expect(screen.queryByText(/Smallest-cluster note:/i)).not.toBeInTheDocument();
        expect(screen.getByText('Spread (Max - Min)')).toBeInTheDocument();
        expect(screen.queryByText('Difference (C1 - C0)')).not.toBeInTheDocument();
      });

      // 4. Switch back to Model C K=2 (Default Baseline)
      fireEvent.change(selector, { target: { value: 'Model_C_K2' } });
      await waitFor(() => {
        expect(selector).toHaveValue('Model_C_K2');
        expect(screen.getByText('Difference (C1 - C0)')).toBeInTheDocument();
        expect(screen.getByText('Absolute Gap')).toBeInTheDocument();
        expect(screen.queryByText(/Smallest-cluster note:/i)).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 5. Indicator Analytics (Route: /indicators)
  // =========================================================================
  describe('Page 5: Indicator Analytics (/indicators)', () => {
    it('allows category filtering, indicator switching, and sorting across 36 states', async () => {
      renderWithContext(<IndicatorAnalytics />, { initialEntries: ['/indicators'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading indicator analytics/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Indicator Analytics' })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByText('States 1–12 of 36')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Next indicator chart page/i }));
      expect(screen.getByText('States 13–24 of 36')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Previous indicator chart page/i }));
      expect(screen.getByText('States 1–12 of 36')).toBeInTheDocument();

      // Check Category Filter Buttons
      const allCatBtn = screen.getByRole('button', { name: /All \(13\)/i });
      const pctCatBtn = screen.getByRole('button', { name: /Percentage Coverage \(9\)/i });
      const binCatBtn = screen.getByRole('button', { name: /Binary Service Adoption \(4\)/i });

      expect(allCatBtn).toBeInTheDocument();
      expect(pctCatBtn).toBeInTheDocument();
      expect(binCatBtn).toBeInTheDocument();

      // Switch category to Binary Service Adoption
      fireEvent.click(binCatBtn);
      expect(screen.getByRole('button', { name: /Signed RoR/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Geo-Referencing/i })).not.toBeInTheDocument();

      // Switch back to Percentage
      fireEvent.click(pctCatBtn);
      expect(screen.getByRole('button', { name: /Map Digitization/i })).toBeInTheDocument();

      // Sort Toggle
      const sortBtn = screen.getByRole('button', { name: /Sort:/i });
      expect(sortBtn).toHaveTextContent(/Low to High/i);
      fireEvent.click(sortBtn);
      expect(sortBtn).toHaveTextContent(/High to Low/i);

      // Summary KPI stats for active indicator
      expect(screen.getByText('National Mean')).toBeInTheDocument();
      expect(screen.getByText('Highest Coverage')).toBeInTheDocument();
      expect(screen.getByText('Lowest Coverage')).toBeInTheDocument();
    });

    it('supports dynamic cluster configuration switching, 36-state table view, and fixed descriptive analytical bands', async () => {
      renderWithContext(<IndicatorAnalytics />, { initialEntries: ['/indicators'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading indicator analytics/i)).not.toBeInTheDocument();
      });

      // Verify Fixed Descriptive Analytical Bands are present
      expect(screen.getByRole('heading', { name: /Fixed Descriptive Analytical Bands/i })).toBeInTheDocument();
      expect(screen.getByText(/Descriptive statistical intervals across 36 States\/UTs/i)).toBeInTheDocument();
      expect(screen.getByText('High Saturation / Advanced Progress')).toBeInTheDocument();
      expect(screen.getByText('Substantial Progress')).toBeInTheDocument();
      expect(screen.getByText('Developing / Intermediate Progress')).toBeInTheDocument();
      expect(screen.getByText('Nascent Progress')).toBeInTheDocument();

      // Verify Cluster Configuration Selector exists and defaults to Model C K=2
      const configSelector = screen.getByRole('combobox', { name: /cluster configuration/i });
      expect(configSelector).toBeInTheDocument();
      expect(screen.getByText(/Cluster 0 Mean/i)).toBeInTheDocument();
      expect(screen.getByText(/Cluster 1 Mean/i)).toBeInTheDocument();

      // Switch to Model B K=3
      fireEvent.change(configSelector, { target: { value: 'Model_B_K3' } });
      await waitFor(() => {
        expect(screen.getByText(/Cluster 2 Mean/i)).toBeInTheDocument();
      });

      // Switch to Model B K=4
      fireEvent.change(configSelector, { target: { value: 'Model_B_K4' } });
      await waitFor(() => {
        expect(screen.getByText(/Cluster 3 Mean/i)).toBeInTheDocument();
      });

      // Switch to Model B K=5
      fireEvent.change(configSelector, { target: { value: 'Model_B_K5' } });
      await waitFor(() => {
        expect(screen.getByText(/Cluster 4 Mean/i)).toBeInTheDocument();
      });

      // Switch back to Model C K=2 (Default Baseline)
      fireEvent.change(configSelector, { target: { value: 'Model_C_K2' } });
      await waitFor(() => {
        expect(screen.queryByText(/Cluster 2 Mean/i)).not.toBeInTheDocument();
      });

      // Switch to 36-State Table View
      const tableViewBtn = screen.getByRole('button', { name: /36-State Table/i });
      fireEvent.click(tableViewBtn);
      expect(screen.getByText(/36-State Performance & Ranking Matrix/i)).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /State \/ Union Territory/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Descriptive Classification/i })).toBeInTheDocument();

      // Switch back to Chart View
      const chartViewBtn = screen.getByRole('button', { name: /Chart View/i });
      fireEvent.click(chartViewBtn);
      expect(screen.getByRole('heading', { name: /Fixed Descriptive Analytical Bands/i })).toBeInTheDocument();
    });

    it('shows source values and active configuration assignments for selected percentage and binary indicators', async () => {
      renderWithContext(<IndicatorAnalytics />, { initialEntries: ['/indicators'] });
      await waitFor(() => expect(screen.getByRole('combobox', { name: /cluster configuration/i })).toHaveValue('Model_C_K2'));

      fireEvent.click(screen.getByRole('button', { name: /36-State Table/i }));
      const selector = screen.getByRole('combobox', { name: /cluster configuration/i });
      const expectedBiharClusters: Record<string, string> = {
        Model_C_K2: 'Cluster 1',
        Model_B_K3: 'Cluster 0',
        Model_B_K4: 'Cluster 0',
        Model_B_K5: 'Cluster 0',
      };

      for (const configId of ['Model_C_K2', 'Model_B_K3', 'Model_B_K4', 'Model_B_K5']) {
        fireEvent.change(selector, { target: { value: configId } });
        await waitFor(() => expect(selector).toHaveValue(configId));

        const biharRow = screen.getByRole('row', { name: /Bihar/ });
        expect(within(biharRow).getByText('100.00%')).toBeInTheDocument();
        expect(within(biharRow).getByText(expectedBiharClusters[configId])).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /RoR Download/i }));
        expect(screen.getByRole('heading', { name: /36-State Performance & Ranking Matrix — Online RoR Download/i })).toBeInTheDocument();
        expect(within(screen.getByRole('row', { name: /Bihar/ })).getByText('1 (Active)')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Map Digitization/i }));
      }
    });
  });

  // =========================================================================
  // 6. State Comparison (Route: /comparison)
  // =========================================================================
  describe('Page 6: State Comparison (/comparison)', () => {
    it('supports dynamic addition, removal, and side-by-side benchmarking of up to 4 states', async () => {
      renderWithContext(<StateComparison />, { initialEntries: ['/comparison'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading state comparison engine/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'State Comparison' })).toBeInTheDocument();

      // Default comparison contains Gujarat and Nagaland
      expect(screen.getAllByText('Gujarat').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Nagaland').length).toBeGreaterThanOrEqual(1);

      // Add a third state from dropdown
      const select = screen.getByRole('combobox', {
  name: 'Add State/UT to comparison',
});
      fireEvent.change(select, { target: { value: 'BIHAR' } });
      expect(screen.getAllByText('Bihar').length).toBeGreaterThanOrEqual(1);

      // Switch tabs between Percentage and Binary
      const binTab = screen.getByRole('button', { name: /Binary Services \(4\)/i });
      fireEvent.click(binTab);
      expect(screen.getByText('Online RoR Download')).toBeInTheDocument();

      const pctTab = screen.getByRole('button', { name: /Percentage Coverage \(9\)/i });
      fireEvent.click(pctTab);
      expect(screen.getByText('Map Digitization')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 7. Gap Analysis (Route: /gaps)
  // =========================================================================
  describe('Page 7: Gap Analysis (/gaps)', () => {
    it('displays ranked gaps, category filter, and Rank #1 divergence card', async () => {
      renderWithContext(<GapAnalysis />, { initialEntries: ['/gaps'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading governance gap analysis/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Gap Analysis' })).toBeInTheDocument();

      // Rank 1 Top Card
      expect(screen.getByText(/Rank #1 Observed Divergence/i)).toBeInTheDocument();
      expect(screen.getByText(/Digitally Signed RoR \(Binary Adoption\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/82\.8%/i).length).toBeGreaterThanOrEqual(1);

      // Category filters
      const binFilter = screen.getByRole('button', { name: /Binary Adoption \(4\)/i });
      fireEvent.click(binFilter);
      expect(screen.getByText('Online Mutation Application')).toBeInTheDocument();

      const allFilter = screen.getByRole('button', { name: /All \(13\)/i });
      fireEvent.click(allFilter);

      // Verify full table
      expect(screen.getByText('Full Gap Analysis Matrix')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#13')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 8. ML Model Insights (Route: /models)
  // =========================================================================
  describe('Page 8: ML Model Insights (/models)', () => {
    it('displays evaluation curves, baseline PCA projection, and supplied model/K evaluation records', async () => {
      renderWithContext(<MLModelInsights />, { initialEntries: ['/models'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading ML model evaluation metrics/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'ML Model Insights' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /cluster configuration/i })).toHaveValue('Model_C_K2');
      expect(screen.queryByText(/K-Means groups States\/UTs with similar observed indicator patterns/i)).not.toBeInTheDocument();
      expect(screen.getByText(/K-Means groups observed patterns; it does not predict outcomes or assign official rankings/i)).toBeInTheDocument();
      expect(screen.getByText(/The preserved notebook evaluates 15 Model\/K records/i)).toBeInTheDocument();

      // Architecture cards
      expect(screen.getByText(/Model A — Baseline/i)).toBeInTheDocument();
      expect(screen.getByText(/Model B — Correlation Reduced/i)).toBeInTheDocument();
      expect(screen.getByText(/Model C — Rare Feature Sensitivity/i)).toBeInTheDocument();

      // Trajectory curves
      expect(screen.getByText(/Silhouette Score Trajectory \(K = 2\.\.6\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Davies-Bouldin Index Trajectory \(K = 2\.\.6\)/i)).toBeInTheDocument();

      // PCA Section
      expect(screen.getByText(/Principal Component Analysis \(PCA\) 2D Projection/i)).toBeInTheDocument();
      expect(screen.getByText(/Baseline projection · Model C \(K=2\)/i)).toBeInTheDocument();
      expect(screen.getByText('Cluster 0 (7)')).toBeInTheDocument();
      expect(screen.getByText('Cluster 1 (29)')).toBeInTheDocument();
      expect(screen.getByAltText(/PCA Cluster Visualization of Digital Land Governance/i)).toBeInTheDocument();

      // Full Model Evaluation Matrix Table
      expect(screen.getByText(/Model Evaluation Matrix \(15 model\/K records\)/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 9. Reports & Downloads (Route: /reports)
  // =========================================================================
  describe('Page 9: Reports & Downloads (/reports)', () => {
    it('renders download links for all 5 CSV datasets, 3 PNG figures, and GeoJSON', async () => {
      renderWithContext(<ReportsDownloads />, { initialEntries: ['/reports'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading download repository/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Reports & Downloads' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Reports, Datasets & Visual Exports/i })).toBeInTheDocument();

      // 5 CSV cards
      expect(screen.getByText('Cleaned_Digital_Land_Governance.csv')).toBeInTheDocument();
      expect(screen.getByText('Final_State_UT_Cluster_Assignments.csv')).toBeInTheDocument();
      expect(screen.getByText('Final_Model_Evaluation_Metrics.csv')).toBeInTheDocument();
      expect(screen.getByText('Final_Cluster_Profiles.csv')).toBeInTheDocument();
      expect(screen.getByText('Cluster_Gap_Analysis.csv')).toBeInTheDocument();

      // 3 PNG asset cards
      expect(screen.getByText('PCA_Cluster_Visualization.png')).toBeInTheDocument();
      expect(screen.getByText('Governance_Indicator_Heatmap.png')).toBeInTheDocument();
      expect(screen.getByText('Binary_Service_Adoption_Heatmap.png')).toBeInTheDocument();

      // GeoJSON download
      expect(screen.getByText('india_states.geojson')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Download GeoJSON \(1\.0 MB\)/i })).toHaveAttribute(
        'href',
        '/data/india_states.geojson'
      );
    });
  });

  // =========================================================================
  // 10. Global Chrome: Sidebar Collapse & Theme Toggle
  // =========================================================================
  describe('Global Chrome & Interactivity', () => {
    it('toggles dark and light mode correctly via ThemeToggle', async () => {
      renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading governance intelligence dataset/i)).not.toBeInTheDocument();
      });

      const themeBtn = screen.getByTitle(/Switch to (dark|light) mode/i);
      expect(themeBtn).toBeInTheDocument();
      const sidebar = document.querySelector('#primary-navigation') as HTMLElement;
      expect(sidebar.className).toContain('bg-[var(--color-sidebar-bg)]');
      expect(screen.getByText('LANDINSIGHT').className).toContain('text-[var(--color-text-primary)]');
      const configuration = screen.getByRole('combobox', { name: /cluster configuration/i });

      const initialDark = document.documentElement.classList.contains('dark');
      expect(configuration.style.colorScheme).toBe(initialDark ? 'dark' : 'light');
      fireEvent.click(themeBtn);

      const updatedDark = document.documentElement.classList.contains('dark');
      expect(updatedDark).toBe(!initialDark);
      expect(document.documentElement.classList.contains('dark')).toBe(updatedDark);
      expect(configuration.style.colorScheme).toBe(updatedDark ? 'dark' : 'light');
      expect(localStorage.getItem('landinsight-theme')).toBe(updatedDark ? 'dark' : 'light');
    });

    it('toggles sidebar collapse state and adjusts layout margin classes', async () => {
      renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading governance intelligence dataset/i)).not.toBeInTheDocument();
      });

      const collapseBtn = screen.getByRole('button', { name: /Collapse/i });
      expect(collapseBtn).toBeInTheDocument();

      // Initially expanded (ml-60)
      const mainWrapper = document.querySelector('[class*="lg:ml-60"]');
      expect(mainWrapper).toBeInTheDocument();

      // Click collapse
      fireEvent.click(collapseBtn);

      // Now collapsed (ml-16)
      const collapsedWrapper = document.querySelector('[class*="lg:ml-16"]');
      expect(collapsedWrapper).toBeInTheDocument();
    });

    it('opens the mobile navigation drawer and closes it after selecting a page', async () => {
      renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });
      await waitFor(() => {
        expect(screen.queryByText(/Loading governance intelligence dataset/i)).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Open navigation menu/i }));
      expect(screen.getAllByRole('button', { name: /Close navigation menu/i })).toHaveLength(2);
      const backdrop = document.querySelector<HTMLButtonElement>('button.fixed.inset-0[aria-label="Close navigation menu"]');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);
      expect(screen.getByRole('button', { name: /Open navigation menu/i })).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(screen.getByRole('button', { name: /Open navigation menu/i }));
      const primaryNav = screen.getByRole('navigation', { name: /Primary navigation/i });
      fireEvent.click(within(primaryNav).getByRole('link', { name: /Governance Map/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Governance Map' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Close navigation menu/i })).not.toBeInTheDocument();
      });
    });

    it('supports responsive viewport dimensions without crashing', async () => {
      const viewports = [
        { width: 1440, height: 900, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Small desktop / tablet' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 390, height: 844, name: 'Mobile' },
        { width: 360, height: 800, name: 'Small mobile' },
      ];

      for (const vp of viewports) {
        window.innerWidth = vp.width;
        window.innerHeight = vp.height;
        fireEvent(window, new Event('resize'));

        const { unmount } = renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });
        await waitFor(() => {
          expect(screen.getByRole('heading', { level: 1, name: 'Executive Overview' })).toBeInTheDocument();
          expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
          expect(screen.queryByText('Total States / UTs')).not.toBeInTheDocument();
        });
        unmount();
      }
    });
  });
});
