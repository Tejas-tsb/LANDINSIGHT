import fs from 'fs';
import path from 'path';
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
    it('renders national summary KPIs, active baseline badge, and observations', async () => {
      renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });

      // Wait for data load
      await waitFor(() => {
        expect(screen.queryByText(/Loading governance intelligence dataset/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: /Executive Governance Overview/i })).toBeInTheDocument();
      expect(screen.getByText(/Active Baseline: Model C \(K=2\)/i)).toBeInTheDocument();

      // Verify KPI stat cards
      expect(screen.getByText('Total States / UTs')).toBeInTheDocument();
      expect(screen.getByText('36')).toBeInTheDocument();
      expect(screen.getByText('Clustering Configuration')).toBeInTheDocument();
      expect(screen.getByText('K = 2')).toBeInTheDocument();
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

      expect(screen.getByRole('heading', { level: 1, name: /National Land Governance Map/i })).toBeInTheDocument();

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

      expect(screen.getByRole('heading', { level: 1, name: /State \/ UT Profile Explorer/i })).toBeInTheDocument();

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

      expect(screen.getByRole('heading', { level: 1, name: /Cluster Intelligence & Profiles/i })).toBeInTheDocument();

      // Check Cluster 0 Profile Card
      expect(screen.getByText(/Cluster 0 — Foundation & Nascent Digital Infrastructure/i)).toBeInTheDocument();
      expect(screen.getByText(/7 States\/UTs \(19\.4%\)/i)).toBeInTheDocument();

      // Check Cluster 1 Profile Card
      expect(screen.getByText(/Cluster 1 — High Digitization & Automated Services/i)).toBeInTheDocument();
      expect(screen.getByText(/29 States\/UTs \(80\.6%\)/i)).toBeInTheDocument();

      // Check Comparative Chart Headers
      expect(screen.getByText(/Cadastral & Spatial Coverage \(% Means\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Citizen Service Adoption \(% Available\)/i)).toBeInTheDocument();

      // Check Metric Comparison Table
      expect(screen.getByText(/Comprehensive Cluster Means & Differential Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText('Difference (C1 - C0)')).toBeInTheDocument();
      expect(screen.getByText('Absolute Gap')).toBeInTheDocument();
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

      expect(screen.getByRole('heading', { level: 1, name: /Indicator Analytics & Distributions/i })).toBeInTheDocument();

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
      expect(sortBtn).toHaveTextContent(/High to Low/i);
      fireEvent.click(sortBtn);
      expect(sortBtn).toHaveTextContent(/Low to High/i);

      // Summary KPI stats for active indicator
      expect(screen.getByText('National Mean')).toBeInTheDocument();
      expect(screen.getByText('Highest Coverage')).toBeInTheDocument();
      expect(screen.getByText('Lowest Coverage')).toBeInTheDocument();
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

      expect(screen.getByRole('heading', { level: 1, name: /State \/ UT Multi-Entity Comparison/i })).toBeInTheDocument();

      // Default comparison contains Gujarat and Nagaland
      expect(screen.getAllByText('Gujarat').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Nagaland').length).toBeGreaterThanOrEqual(1);

      // Add a third state from dropdown
      const select = screen.getByRole('combobox');
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

      expect(screen.getByRole('heading', { level: 1, name: /Digital Governance Gap Analysis/i })).toBeInTheDocument();

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
    it('displays evaluation curves, PCA 2D scatter figure, and 15-run evaluation table', async () => {
      renderWithContext(<MLModelInsights />, { initialEntries: ['/models'] });

      await waitFor(() => {
        expect(screen.queryByText(/Loading ML model evaluation metrics/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: /Unsupervised ML Model Insights/i })).toBeInTheDocument();
      expect(screen.getByText(/Selected: Model C \(K=2\)/i)).toBeInTheDocument();

      // Architecture cards
      expect(screen.getByText(/Model A — Baseline/i)).toBeInTheDocument();
      expect(screen.getByText(/Model B — Correlation Reduced/i)).toBeInTheDocument();
      expect(screen.getByText(/Model C — Rare Feature Sensitivity/i)).toBeInTheDocument();

      // Trajectory curves
      expect(screen.getByText(/Silhouette Score Trajectory \(K = 2\.\.6\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Davies-Bouldin Index Trajectory \(K = 2\.\.6\)/i)).toBeInTheDocument();

      // PCA Section
      expect(screen.getByText(/Principal Component Analysis \(PCA\) 2D Projection/i)).toBeInTheDocument();
      expect(screen.getByAltText(/PCA Cluster Visualization of Digital Land Governance/i)).toBeInTheDocument();

      // Full Model Evaluation Matrix Table
      expect(screen.getByText(/Full Model Evaluation Matrix \(15 Experimental Runs\)/i)).toBeInTheDocument();
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

      expect(screen.getByRole('heading', { level: 1, name: /Reports, Datasets & Visual Exports/i })).toBeInTheDocument();

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

      const initialDark = document.documentElement.classList.contains('dark');
      fireEvent.click(themeBtn);

      const updatedDark = document.documentElement.classList.contains('dark');
      expect(updatedDark).toBe(!initialDark);
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
      const mainWrapper = document.querySelector('.ml-60');
      expect(mainWrapper).toBeInTheDocument();

      // Click collapse
      fireEvent.click(collapseBtn);

      // Now collapsed (ml-16)
      const collapsedWrapper = document.querySelector('.ml-16');
      expect(collapsedWrapper).toBeInTheDocument();
    });

    it('supports responsive viewport dimensions without crashing', async () => {
      const viewports = [
        { width: 1440, height: 900, name: 'Desktop' },
        { width: 1280, height: 800, name: 'Laptop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 390, height: 844, name: 'Mobile' },
      ];

      for (const vp of viewports) {
        window.innerWidth = vp.width;
        window.innerHeight = vp.height;
        fireEvent(window, new Event('resize'));

        const { unmount } = renderWithContext(<ExecutiveOverview />, { initialEntries: ['/'] });
        await waitFor(() => {
          expect(screen.getByText('36')).toBeInTheDocument();
        });
        unmount();
      }
    });
  });
});
