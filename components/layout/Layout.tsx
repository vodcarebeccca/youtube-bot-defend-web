/**
 * Layout Component - Main layout wrapper dengan sidebar
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { Wifi, WifiOff, Bot, Database } from 'lucide-react';

interface LayoutProps {
  botCount: number;
  botSource: 'local' | 'firebase' | 'none';
  firebaseConnected: boolean;
  isMonitoring: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  botCount,
  botSource,
  firebaseConnected,
  isMonitoring,
}) => {
  const { colors } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bgPrimary }}>
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div 
        className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}
      >
        {/* Top Bar */}
        <header 
          className="sticky top-0 z-30 px-6 py-3 border-b backdrop-blur-sm"
          style={{ 
            backgroundColor: `${colors.bgPrimary}ee`,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center justify-between">
            {/* Left - Status */}
            <div className="flex items-center gap-4">
              {/* Monitoring Status */}
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  isMonitoring ? 'text-green-400' : 'text-gray-500'
                }`}
                style={{ backgroundColor: colors.bgSecondary }}
              >
                {isMonitoring ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span>{isMonitoring ? 'MONITORING' : 'OFFLINE'}</span>
              </div>
            </div>

            {/* Right - Info */}
            <div className="flex items-center gap-3">
              {/* Bot Count */}
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{ 
                  backgroundColor: colors.bgSecondary,
                  color: botSource === 'firebase' ? '#3b82f6' : colors.success 
                }}
              >
                <Bot size={16} />
                <span>{botCount} Bot</span>
                <span>{botSource === 'firebase' ? '☁️' : '💾'}</span>
              </div>

              {/* Firebase Status */}
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  firebaseConnected ? 'text-green-400' : 'text-gray-500'
                }`}
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Database size={14} />
                <span>{firebaseConnected ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
