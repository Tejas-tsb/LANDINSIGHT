import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { NAV_ITEMS } from '../../lib/constants';
import { ClusterConfigurationSelector } from '../ClusterConfigurationSelector';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const currentPage = NAV_ITEMS.find((item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  });

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Main content area */}
      <div
        className={`transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-3 sm:px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-controls="primary-navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
              className="lg:hidden p-2 -ml-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] truncate">
              {currentPage?.label ?? 'LANDINSIGHT'}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ClusterConfigurationSelector />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
