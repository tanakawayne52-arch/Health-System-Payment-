import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_NAV_ITEMS, ROLE_LABELS } from '@/types';
import type { UserRole } from '@/types';
import {
  LayoutDashboard, FileText, Users, BarChart3, ClipboardList,
  Calendar, Wallet, GitCompare, UserCog, LogOut, ChevronLeft,
  ChevronRight, Bell,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, FileText, Users, BarChart3, ClipboardList,
  Calendar, Wallet, GitCompare, UserCog,
};

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/beneficiaries': 'Beneficiary Management',
  '/payment-lists': 'Payment Lists',
  '/payment-lists/new': 'Create Payment List',
  '/payment-batches': 'Payment Batches',
  '/payment-cycles': 'Payment Cycles',
  '/reconciliation': 'Reconciliation',
  '/audit-trail': 'Audit Trail',
  '/reports': 'Reports',
  '/users': 'User Management',
  '/vhw-national-dashboard': 'VHW National Dashboard',
  '/vhw-provincial-dashboard': 'VHW Provincial Dashboard',
};

// Create a map of paths to lazy component loaders for preloading
const preloadMap: Record<string, () => void> = {
  '/': () => import('@/pages/ProvincialDashboard'),
  '/beneficiaries': () => import('@/pages/BeneficiariesPage'),
  '/payment-lists': () => import('@/pages/PaymentListsPage'),
  '/payment-lists/new': () => import('@/pages/PaymentListCreatePage'),
  '/payment-batches': () => import('@/pages/PaymentBatchesPage'),
  '/payment-cycles': () => import('@/pages/PaymentCyclesPage'),
  '/reconciliation': () => import('@/pages/ReconciliationPage'),
  '/audit-trail': () => import('@/pages/AuditTrailPage'),
  '/reports': () => import('@/pages/ReportsPage'),
  '/users': () => import('@/pages/UsersPage'),
  '/vhw-national-dashboard': () => import('@/pages/VhwNationalDashboard'),
  '/vhw-provincial-dashboard': () => import('@/pages/VhwProvincialDashboard'),
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isNationalLevel } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!user) return null;

  const allNavItems = ROLE_NAV_ITEMS[user.role as UserRole] || [];
  const navItems = allNavItems.filter(item => {
    if (item.path === '/vhw-national-dashboard') {
      return isNationalLevel;
    }
    return true;
  });
  const roleLabel = ROLE_LABELS[user.role as UserRole];
  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#1a365d] z-50 flex items-center justify-between px-4"
        style={{ borderBottom: '2px solid #0d9488' }}>
        {/* Left: Emblem + FEPMS */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
            <img
              src="/MOHCC Designed logo.png"
              alt="MoHCC Emblem"
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="text-white font-semibold text-base tracking-wide">FEPMS</span>
        </div>

        {/* Center: Page Title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-white/90 font-semibold text-[15px]">
            {pageTitles[location.pathname] || 'FEPMS'}
          </span>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-white/80 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0d9488] flex items-center justify-center">
              <span className="text-white font-semibold text-xs">{initials}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-white text-[13px] font-normal leading-tight">{user.fullName}</p>
              <p className="text-white/70 text-[10px] font-medium leading-tight">{roleLabel}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-[60px] bottom-0 bg-[#1a365d] z-40 flex flex-col transition-all duration-200"
        style={{ width: collapsed ? 72 : 260 }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-4 w-6 h-6 bg-[#0d9488] rounded-full flex items-center justify-center text-white hover:bg-[#0f766e] transition-colors z-50"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Role Label */}
        <div className="px-3 pt-4 pb-2">
          {!collapsed && (
            <p className="text-[#0d9488] text-[10px] font-semibold uppercase tracking-wider px-3">
              {roleLabel}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const preload = preloadMap[item.path];
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => preload && preload()}
                onTouchStart={() => preload && preload()}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-left ${
                  isActive
                    ? 'nav-active text-white'
                    : 'text-[#94a3b8] hover:bg-[#2c5282] hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[#94a3b8] hover:bg-[#2c5282] hover:text-white transition-all duration-150"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="pt-[60px] min-h-screen transition-all duration-200"
        style={{ marginLeft: collapsed ? 72 : 260 }}
      >
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
