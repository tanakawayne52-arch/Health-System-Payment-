import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_NAV_ITEMS, ROLE_LABELS } from '@/types';
import type { UserRole, NavItem } from '@/types';
import {
  LayoutDashboard, FileText, Users, BarChart3, ClipboardList,
  Calendar, Wallet, GitCompare, UserCog, LogOut, ChevronLeft,
  ChevronRight, Bell, Settings, Activity, ChevronDown,
} from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, FileText, Users, BarChart3, ClipboardList,
  Calendar, Wallet, GitCompare, UserCog, Settings, Activity,
};

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/beneficiaries': 'VHW Records',
  '/payment-lists': 'Payment Lists',
  '/payment-lists/new': 'Create Payment List',
  '/payment-batches': 'Payment Batches',
  '/payment-cycles': 'Payment Cycles',
  '/reconciliation': 'Reconciliation',
  '/audit-trail': 'Audit Trail',
  '/reports': 'Reports',
  '/users': 'User Management',
  '/vhw-national-dashboard': 'National VHW Analytics',
  '/vhw-provincial-dashboard': 'Provincial VHW Analytics',
  '/vhw-master-records': 'VHW Master Records',
  '/workforce-summary': 'Workforce Master Summary',
  '/notifications': 'Notifications & Tasks',
  '/facilities': 'Physical Facilities',
};

function NavItemComponent({ 
  item, 
  collapsed, 
  isActive, 
  onNavigate 
}: { 
  item: NavItem; 
  collapsed: boolean; 
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(isActive(item.path));
  const Icon = iconMap[item.icon] || LayoutDashboard;
  const hasChildren = item.children && item.children.length > 0;
  const isCurrentlyActive = isActive(item.path);

  const handleClick = () => {
    if (hasChildren && !collapsed) {
      setIsOpen(!isOpen);
    } else {
      onNavigate(item.path);
    }
  };

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-left ${
          isCurrentlyActive && !hasChildren
            ? 'nav-active text-white'
            : 'text-white hover:bg-white/5 hover:text-white'
        }`}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0 text-white" />
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-white">{item.label}</span>
            {hasChildren && (
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-white ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </>
        )}
      </button>

      {hasChildren && isOpen && !collapsed && (
        <div className="ml-4 pl-4 border-l border-white/10 space-y-1 animate-fade-in">
          {item.children?.map((child) => {
            const ChildIcon = iconMap[child.icon] || LayoutDashboard;
            return (
              <button
                key={child.path}
                onClick={() => onNavigate(child.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-left ${
                  isActive(child.path)
                    ? 'text-white bg-[#0d9488]/20'
                    : 'text-white hover:text-white hover:bg-white/5'
                }`}
              >
                <ChildIcon className="w-4 h-4 flex-shrink-0 text-white" />
                <span className="text-xs font-medium text-white">{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!user) return null;

  const navItems = ROLE_NAV_ITEMS[user.role as UserRole] || [];
  const roleLabel = ROLE_LABELS[user.role as UserRole];
  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 bg-[#0f172a] text-white z-50 flex flex-col transition-all duration-300 sidebar-glass"
        style={{ width: collapsed ? 80 : 280 }}
      >
        {/* Sidebar Header: Logo & Branding */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex-shrink-0 shadow-lg">
            <img
              src="/MOHCC Designed logo.png"
              alt="MoHCC"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight tracking-tight">FEPMS</span>
              <span className="text-[10px] text-white/90 font-semibold uppercase tracking-widest">MoHCC Zimbabwe</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
          {navItems.map(item => (
            <NavItemComponent 
              key={item.path} 
              item={item} 
              collapsed={collapsed} 
              isActive={isActive}
              onNavigate={(path) => navigate(path)}
            />
          ))}
        </nav>

        {/* Sidebar Footer: User & Settings */}
        <div className="p-4 border-t border-white/5">
          {!collapsed ? (
            <div className="bg-white/5 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2dd4bf] flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <span className="text-[#0f172a] font-bold text-sm">{initials}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.fullName}</p>
                  <p className="text-white/90 text-[10px] font-medium uppercase truncate">{roleLabel}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-colors border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#2dd4bf] flex items-center justify-center">
                <span className="text-[#0f172a] font-bold text-xs">{initials}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => navigate('/notifications')} className="p-2 text-white hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/settings')} className="p-2 text-white hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button onClick={logout} className="p-2 text-white hover:text-red-400 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions (expanded view) */}
        {!collapsed && (
          <div className="px-4 pb-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/notifications')} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/7 rounded-md text-white">
                <Bell className="w-4 h-4" />
                <span className="text-xs font-medium">Notifications</span>
              </button>
              <button onClick={() => navigate('/settings')} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/7 rounded-md text-white">
                <Settings className="w-4 h-4" />
                <span className="text-xs font-medium">Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-[#2dd4bf] rounded-full flex items-center justify-center text-[#0f172a] shadow-lg hover:scale-110 transition-transform z-50"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300 min-h-screen"
        style={{ marginLeft: collapsed ? 80 : 280 }}
      >
        {/* Content Header (breadcrumbs only — pages render their own titles) */}
        <header className="h-auto px-8 pt-4 pb-2 flex flex-col gap-2 justify-between sticky top-0 bg-[#f1f5f9]/80 backdrop-blur-md z-30">
          <div className="flex items-center justify-between w-full">
            <div>
              <Breadcrumbs />
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
