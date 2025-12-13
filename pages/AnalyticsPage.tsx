/**
 * Analytics Page - Real-time statistics dan charts dari Firebase
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getAnalyticsData, AnalyticsData } from '../services/analyticsService';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  ShieldAlert,
  Zap,
  Target,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<7 | 30 | 365>(7);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const analytics = await getAnalyticsData(dateRange);
      setData(analytics);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    trend?: number;
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
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend)}%</span>
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

  // Day labels
  const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[date.getDay()];
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} style={{ color: colors.accent }} />
      </div>
    );
  }

  const analytics = data || {
    totalMessages: 0,
    spamBlocked: 0,
    actionsTaken: 0,
    accuracy: 0,
    spamByType: { judol: 0, link: 0, toxic: 0, other: 0 },
    dailyData: [],
    trends: { messages: 0, spam: 0, actions: 0, accuracy: 0 },
  };

  // Calculate spam type percentages
  const totalSpamByType = analytics.spamByType.judol + analytics.spamByType.link + 
                          analytics.spamByType.toxic + analytics.spamByType.other;
  
  const spamTypes = [
    { 
      type: 'Judol/Gambling', 
      count: analytics.spamByType.judol,
      percent: totalSpamByType > 0 ? Math.round((analytics.spamByType.judol / totalSpamByType) * 100) : 0, 
      color: colors.danger 
    },
    { 
      type: 'Link Spam', 
      count: analytics.spamByType.link,
      percent: totalSpamByType > 0 ? Math.round((analytics.spamByType.link / totalSpamByType) * 100) : 0, 
      color: colors.warning 
    },
    { 
      type: 'Toxic/Vulgar', 
      count: analytics.spamByType.toxic,
      percent: totalSpamByType > 0 ? Math.round((analytics.spamByType.toxic / totalSpamByType) * 100) : 0, 
      color: '#a855f7' 
    },
    { 
      type: 'Other', 
      count: analytics.spamByType.other,
      percent: totalSpamByType > 0 ? Math.round((analytics.spamByType.other / totalSpamByType) * 100) : 0, 
      color: colors.info 
    },
  ];

  // Get max spam for chart scaling
  const maxSpam = Math.max(...analytics.dailyData.map(d => d.spamBlocked), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
            <BarChart3 size={28} style={{ color: colors.info }} />
            Analytics
          </h1>
          <p style={{ color: colors.textMuted }}>
            Statistik dan analisis aktivitas moderasi
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.bgCard, color: colors.textSecondary }}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {([7, 30, 365] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: dateRange === range ? colors.accent : colors.bgCard,
                  color: dateRange === range ? 'white' : colors.textSecondary,
                }}
              >
                {range === 365 ? 'All Time' : `${range} Days`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare size={20} />}
          value={analytics.totalMessages}
          label="Total Messages"
          color={colors.info}
          trend={analytics.trends.messages}
        />
        <StatCard
          icon={<ShieldAlert size={20} />}
          value={analytics.spamBlocked}
          label="Spam Blocked"
          color={colors.danger}
          trend={analytics.trends.spam}
        />
        <StatCard
          icon={<Zap size={20} />}
          value={analytics.actionsTaken}
          label="Actions Taken"
          color={colors.success}
          trend={analytics.trends.actions}
        />
        <StatCard
          icon={<Target size={20} />}
          value={analytics.accuracy}
          label="Action Rate %"
          color="#a855f7"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
            📈 Daily Activity ({dateRange} Days)
          </h3>
          {analytics.dailyData.length > 0 ? (
            <div className="flex items-end justify-between h-40 px-2 gap-1">
              {analytics.dailyData.slice(-7).map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full rounded-t transition-all duration-500 min-h-[4px]"
                    style={{ 
                      height: `${Math.max(4, (day.spamBlocked / maxSpam) * 120)}px`,
                      backgroundColor: colors.success,
                    }}
                    title={`${day.spamBlocked} spam blocked`}
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    {getDayLabel(day.date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center" style={{ color: colors.textMuted }}>
              Belum ada data
            </div>
          )}
        </div>

        {/* Spam Types */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
            🚫 Spam by Type
          </h3>
          {totalSpamByType > 0 ? (
            <div className="space-y-4">
              {spamTypes.map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: colors.textSecondary }}>
                      {item.type} ({item.count})
                    </span>
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
          ) : (
            <div className="h-32 flex items-center justify-center" style={{ color: colors.textMuted }}>
              Belum ada spam terdeteksi
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      {analytics.totalMessages === 0 && (
        <div 
          className="p-5 rounded-xl text-center"
          style={{ backgroundColor: colors.bgCard }}
        >
          <p style={{ color: colors.textMuted }}>
            📊 Data analytics akan muncul setelah monitoring aktif.
            <br />
            Mulai monitoring untuk melihat statistik real-time.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
