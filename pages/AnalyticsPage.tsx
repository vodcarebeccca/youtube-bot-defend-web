/**
 * Analytics Page - Statistics dan charts
 */
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  ShieldAlert,
  Zap,
  Target,
} from 'lucide-react';

interface AnalyticsPageProps {
  stats: {
    totalChat: number;
    spamDetected: number;
    actionsTaken: number;
    quotaUsed: number;
  };
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ stats }) => {
  const { colors } = useTheme();

  // Stat card component
  const StatCard = ({ 
    icon, 
    value, 
    label, 
    color, 
    trend 
  }: { 
    icon: React.ReactNode; 
    value: number; 
    label: string; 
    color: string;
    trend?: { value: number; up: boolean };
  }) => (
    <div 
      className="p-5 rounded-xl"
      style={{ backgroundColor: colors.bgCard }}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.up ? 'text-green-400' : 'text-red-400'}`}>
            {trend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color }}>
        {value.toLocaleString()}
      </div>
      <div className="text-sm" style={{ color: colors.textMuted }}>
        {label}
      </div>
    </div>
  );

  // Simple bar for chart
  const Bar = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <div 
          className="rounded-t transition-all duration-500"
          style={{ 
            height: `${Math.max(20, (value / max) * 150)}px`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-xs w-8 text-center" style={{ color: colors.textMuted }}>{label}</span>
    </div>
  );

  // Mock data for charts
  const weeklyData = [
    { day: 'Sen', spam: 45 },
    { day: 'Sel', spam: 62 },
    { day: 'Rab', spam: 38 },
    { day: 'Kam', spam: 85 },
    { day: 'Jum', spam: 72 },
    { day: 'Sab', spam: 55 },
    { day: 'Min', spam: stats.spamDetected || 30 },
  ];

  const spamTypes = [
    { type: 'Judol/Gambling', percent: 45, color: colors.danger },
    { type: 'Link Spam', percent: 25, color: colors.warning },
    { type: 'Toxic/Hate', percent: 18, color: '#a855f7' },
    { type: 'Other', percent: 12, color: colors.info },
  ];

  const maxSpam = Math.max(...weeklyData.map(d => d.spam));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
            <BarChart3 size={28} style={{ color: colors.info }} />
            Analytics
          </h1>
          <p style={{ color: colors.textMuted }}>
            Statistik dan analisis aktivitas moderasi
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          {['7 Days', '30 Days', 'All Time'].map((range, i) => (
            <button
              key={range}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
              style={{ 
                backgroundColor: i === 0 ? colors.accent : colors.bgCard,
                color: i === 0 ? 'white' : colors.textSecondary,
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare size={20} />}
          value={stats.totalChat || 8542}
          label="Total Messages"
          color={colors.info}
          trend={{ value: 12, up: true }}
        />
        <StatCard
          icon={<ShieldAlert size={20} />}
          value={stats.spamDetected || 423}
          label="Spam Blocked"
          color={colors.danger}
          trend={{ value: 8, up: false }}
        />
        <StatCard
          icon={<Zap size={20} />}
          value={stats.actionsTaken || 398}
          label="Actions Taken"
          color={colors.success}
          trend={{ value: 15, up: true }}
        />
        <StatCard
          icon={<Target size={20} />}
          value={94}
          label="Accuracy %"
          color="#a855f7"
          trend={{ value: 2, up: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
            📈 Daily Activity (7 Days)
          </h3>
          <div className="flex items-end justify-between h-40 px-4">
            {weeklyData.map((data) => (
              <Bar 
                key={data.day}
                value={data.spam}
                max={maxSpam}
                label={data.day}
                color={colors.success}
              />
            ))}
          </div>
        </div>

        {/* Spam Types */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
            🚫 Spam by Type
          </h3>
          <div className="space-y-4">
            {spamTypes.map((item) => (
              <div key={item.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: colors.textSecondary }}>{item.type}</span>
                  <span style={{ color: item.color }}>{item.percent}%</span>
                </div>
                <div 
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.bgTertiary }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div 
        className="p-5 rounded-xl text-center"
        style={{ backgroundColor: colors.bgCard }}
      >
        <p style={{ color: colors.textMuted }}>
          📊 Analytics lebih lengkap akan tersedia di versi mendatang.
          <br />
          Data saat ini berdasarkan sesi monitoring aktif.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
