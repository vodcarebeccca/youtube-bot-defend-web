/**
 * Admin Panel for YouTube Bot Defend Web App
 * Terpisah dari Admin Panel Python Tools
 */
import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, MessageSquare, Settings, BarChart3, 
  Bell, Ban, Key, Cloud, CloudOff, RefreshCw, 
  Plus, Trash2, Check, X, AlertTriangle, Send, Clock
} from 'lucide-react';

// Import admin services
import {
  checkAdminAuth,
  getWebAppStats,
  getBots,
  getSpamPatterns,
  addSpamPattern,
  deleteSpamPattern,
  getBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  getBroadcasts,
  sendBroadcast,
  deleteBroadcast,
  getSpamReports,
  updateSpamReport,
  getRemoteConfig,
  updateRemoteConfig,
  getLicenses,
  addLicense,
  revokeLicense,
  getTotalUsage,
  getUsageStats,
} from './adminService';

type TabType = 'dashboard' | 'bots' | 'patterns' | 'blacklist' | 'broadcasts' | 'reports' | 'licenses' | 'settings';

const AdminApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('webAppAdminAuth');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    // Password from environment variable (secure) or fallback for development
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    
    if (adminPassword === validPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('webAppAdminAuth', 'authenticated');
      setError(null);
    } else {
      setError('Password salah!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('webAppAdminAuth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-gray-700">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="text-emerald-500" size={32} />
            <h1 className="text-2xl font-bold text-white">Web App Admin</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
                placeholder="Enter admin password"
              />
            </div>
            
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            
            <button
              onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { id: 'bots', label: 'Bot Tokens', icon: <Users size={18} /> },
    { id: 'patterns', label: 'Spam Patterns', icon: <MessageSquare size={18} /> },
    { id: 'blacklist', label: 'Blacklist', icon: <Ban size={18} /> },
    { id: 'broadcasts', label: 'Broadcasts', icon: <Bell size={18} /> },
    { id: 'reports', label: 'Spam Reports', icon: <AlertTriangle size={18} /> },
    { id: 'licenses', label: 'Licenses', icon: <Key size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-emerald-500" size={28} />
            <div>
              <h1 className="text-xl font-bold text-white">Web App Admin Panel</h1>
              <p className="text-xs text-gray-500">YouTube Bot Defend - Web Version</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-[calc(100vh-73px)] border-r border-gray-700">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'bots' && <BotsTab />}
          {activeTab === 'patterns' && <PatternsTab />}
          {activeTab === 'blacklist' && <BlacklistTab />}
          {activeTab === 'broadcasts' && <BroadcastsTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'licenses' && <LicensesTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
};

// Dashboard Tab
const DashboardTab: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const [statsData, usageData] = await Promise.all([
      getWebAppStats(),
      getTotalUsage(),
    ]);
    setStats(statsData);
    setUsage(usageData);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button 
          onClick={loadStats}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      
      {/* Config Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Bots" value={stats?.totalBots || 0} icon={<Users />} color="blue" />
        <StatCard title="Spam Patterns" value={stats?.totalPatterns || 0} icon={<MessageSquare />} color="emerald" />
        <StatCard title="Blacklisted Users" value={stats?.totalBlacklist || 0} icon={<Ban />} color="red" />
        <StatCard title="Pending Reports" value={stats?.pendingReports || 0} icon={<AlertTriangle />} color="yellow" />
      </div>

      {/* Usage Stats */}
      <h3 className="text-lg font-semibold mb-4 text-gray-300">📊 Total Usage (All Time)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total API Calls" value={usage?.totalApiCalls || 0} icon={<BarChart3 />} color="purple" />
        <StatCard title="Spam Terdeteksi" value={usage?.totalSpamDetected || 0} icon={<Shield />} color="red" />
        <StatCard title="Pesan Dihapus" value={usage?.totalDeleted || 0} icon={<Trash2 />} color="emerald" />
        <StatCard title="User Dibanned" value={usage?.totalBanned || 0} icon={<Ban />} color="red" />
      </div>

      {/* Today Stats */}
      <h3 className="text-lg font-semibold mb-4 text-gray-300">📅 Hari Ini</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="API Calls Hari Ini" value={usage?.todayApiCalls || 0} icon={<BarChart3 />} color="blue" />
        <StatCard title="Spam Hari Ini" value={usage?.todaySpamDetected || 0} icon={<Shield />} color="emerald" />
        <StatCard title="Total Sessions" value={usage?.totalSessions || 0} icon={<Users />} color="purple" />
        <StatCard title="User Timeout" value={usage?.totalTimeout || 0} icon={<Clock />} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">ℹ️ Info</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Data usage diupdate setiap kali user pakai web app</p>
            <p>• API Calls = jumlah request ke YouTube API</p>
            <p>• Pakai OAuth jadi tidak ada batas quota harian</p>
            <p>• Data tersimpan di Firebase collection <code className="bg-gray-700 px-1 rounded">webapp_usage</code></p>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">🔧 Quick Actions</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              {stats?.pendingReports > 0 
                ? `⚠️ Ada ${stats.pendingReports} report menunggu review`
                : '✅ Tidak ada report pending'}
            </p>
            <p className="text-sm text-gray-400">
              {stats?.totalBots > 0 
                ? `✅ ${stats.totalBots} bot aktif`
                : '⚠️ Belum ada bot - tambahkan di tab Bot Tokens'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-900/20 border-blue-900/50 text-blue-400',
    emerald: 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400',
    red: 'bg-red-900/20 border-red-900/50 text-red-400',
    purple: 'bg-purple-900/20 border-purple-900/50 text-purple-400',
    yellow: 'bg-yellow-900/20 border-yellow-900/50 text-yellow-400',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
};

// Import tab components
import PatternsTabComponent from './tabs/PatternsTab';
import BroadcastsTabComponent from './tabs/BroadcastsTab';
import SettingsTabComponent from './tabs/SettingsTab';
import BotsTabComponent from './tabs/BotsTab';

const BotsTab: React.FC = () => <BotsTabComponent />;

const PatternsTab: React.FC = () => <PatternsTabComponent />;

const BlacklistTab: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Global Blacklist</h2>
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-gray-400 mb-4">
        Blacklist users yang akan otomatis di-ban di semua channel.
      </p>
      <p className="text-sm text-gray-500">
        Collection: <code className="bg-gray-700 px-2 py-1 rounded">webapp_blacklist</code>
      </p>
    </div>
  </div>
);

const BroadcastsTab: React.FC = () => <BroadcastsTabComponent />;

const ReportsTab: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Spam Reports</h2>
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-gray-400 mb-4">
        Review laporan spam dari users (false positive/negative).
      </p>
      <p className="text-sm text-gray-500">
        Collection: <code className="bg-gray-700 px-2 py-1 rounded">webapp_reports</code>
      </p>
    </div>
  </div>
);

const LicensesTab: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold mb-6">Licenses</h2>
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-gray-400 mb-4">
        Kelola license untuk fitur premium (jika diaktifkan).
      </p>
      <p className="text-sm text-gray-500">
        Collection: <code className="bg-gray-700 px-2 py-1 rounded">webapp_licenses</code>
      </p>
    </div>
  </div>
);

const SettingsTab: React.FC = () => <SettingsTabComponent />;

export default AdminApp;
