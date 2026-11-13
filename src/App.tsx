import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/themeContext';
import { DataProvider } from './lib/dataContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/ui/LoadingState';

const ExecutiveOverview = lazy(() => import('./pages/ExecutiveOverview'));
const GovernanceMap = lazy(() => import('./pages/GovernanceMap'));
const StateExplorer = lazy(() => import('./pages/StateExplorer'));
const ClusterIntelligence = lazy(() => import('./pages/ClusterIntelligence'));
const IndicatorAnalytics = lazy(() => import('./pages/IndicatorAnalytics'));
const StateComparison = lazy(() => import('./pages/StateComparison'));
const GapAnalysis = lazy(() => import('./pages/GapAnalysis'));
const MLModelInsights = lazy(() => import('./pages/MLModelInsights'));
const ReportsDownloads = lazy(() => import('./pages/ReportsDownloads'));

export function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingState message="Loading module..." />}>
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
