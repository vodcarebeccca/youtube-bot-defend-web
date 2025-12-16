/**
 * Sidebar Component - Navigation sidebar dengan menu items
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard,
  Shield,
  ScrollText,
  Settings,
  BarChart3,
  Bot,
  ListFilter,
  Palette,
  ChevronLeft,
  ChevronRight,
  Coffee,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { colors } = useTheme();
  const location = useLocation();

  const mainNavItems: NavItem[] = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/monitoring', icon: <Shield size={20} />, label: 'Live Monitoring' },
    { path: '/video-comments', icon: <MessageSquare size={20} />, label: 'Video Comments', badge: 'NEW' },
    { path: '/logs', icon: <ScrollText size={20} />, label: 'Moderation Log' },
    { path: '/detection', icon: <ListFilter size={20} />, label: 'Spam Detection' },
  ];

  const managementNavItems: NavItem[] = [
    { path: '/bots', icon: <Bot size={20} />, label: 'Bot Manager' },
    { path: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
  ];

  const settingsNavItems: NavItem[] = [
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    { path: '/themes', icon: <Palette size={20} />, label: 'Themes' },
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
          ${isActive 
            ? 'text-white' 
            : 'text-gray-400 hover:text-white'
          }
        `}
        style={{
          backgroundColor: isActive ? colors.sidebarActive : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = colors.sidebarHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      {!collapsed && (
        <h3 
          className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map(renderNavItem)}
      </nav>
    </div>
  );

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
      style={{ backgroundColor: colors.sidebarBg }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: colors.border }}>
        <div 
          className="flex-shrink-0 w-9 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: colors.accent }}
        >
          <span className="text-white text-sm font-bold">▶</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm truncate">Bot Defend</h1>
            <p className="text-xs truncate" style={{ color: colors.textMuted }}>
              YouTube Moderation
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {renderSection('Main Menu', mainNavItems)}
        {renderSection('Management', managementNavItems)}
        {renderSection('Settings', settingsNavItems)}
      </div>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t" style={{ borderColor: colors.border }}>
        {/* Support Button */}
        <a
          href="https://trakteer.id/ziver_rfl"
          target="_blank"
          rel="noopener noreferrer"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
            bg-pink-600 hover:bg-pink-700 text-white mb-3
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <Coffee size={18} />
          {!collapsed && <span className="text-sm font-medium">Support Us</span>}
        </a>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: colors.textMuted }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.sidebarHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
