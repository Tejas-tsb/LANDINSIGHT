import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Search,
  GitBranch,
  BarChart3,
  GitCompareArrows,
  TrendingUp,
  Brain,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from 'lucide-react';
import { NAV_ITEMS } from '../../lib/constants';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard,
  Map,
  Search,
  GitBranch,
  BarChart3,
  GitCompareArrows,
  TrendingUp,
  Brain,
  FileDown,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-200 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
        bg-[var(--color-sidebar-bg)] border-r border-[var(--color-border)]`}
    >
      {/* Brand */}
      <div className="flex items-center h-14 px-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Landmark size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white tracking-wide truncate">
                LANDINSIGHT
              </h1>
              <p className="text-[10px] text-slate-400 truncate leading-tight">
                Governance Intelligence
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-[var(--color-sidebar-item-active)] text-[var(--color-sidebar-text-active)] font-medium'
                        : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-item-hover)] hover:text-[var(--color-sidebar-text-active)]'
                    }`
                  }
                  title={item.label}
                >
                  {Icon && <Icon size={18} />}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-2 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-sm
                     text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-item-hover)]
                     hover:text-[var(--color-sidebar-text-active)] transition-colors duration-150"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
