/**
 * Dashboard Page - Overview stats dan quick actions
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { 
  MessageSquare, 
  ShieldAlert, 
  Zap, 
  Activity,
  TrendingUp,
  TrendingDown,
  Play,
  ExternalLink,
} from 'lucide-react';

// Animated counter hook
const useAnimatedCounter = (value: number, duration = 800) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const startValue = prevValue.current;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (value - startValue) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
};

interface DashboardPageProps {
  stats: {
    totalChat: number;
    spamDetected: number;
    actionsTaken: number;
    quotaUsed: number;
  };
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  onStartMonitoring: () => void;
  isMonitoring: boolean;
  botCount: number;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  videoUrl,
  setVideoUrl,
  onStartMonitoring,
  isMonitoring,
  botCount,
}) => {
  const { colors } = useTheme();

  const toast = useToast();

  // Animated Stat card component
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
  }) => {
    const animatedValue = useAnimatedCounter(value);
    
    return (
      <div 
        className="stat-card-animated p-5 rounded-xl cursor-default"
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
        <div className="text-3xl font-bold mb-1 counter-animated" style={{ color }}>
          {animatedValue.toLocaleString()}
        </div>
        <div className="text-sm" style={{ color: colors.textMuted }}>
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          Dashboard
        </h1>
        <p style={{ color: colors.textMuted }}>
          Selamat datang! Monitor aktivitas bot kamu di sini.
        </p>
      </div>

      {/* Connection Card */}
      <div 
        className="p-6 rounded-xl"
        style={{ backgroundColor: colors.bgCard }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔗</span>
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Connect to YouTube Live
          </h2>
        </div>
        
        <div className="flex gap-3">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... atau https://youtube.com/live/..."
            disabled={isMonitoring}
            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none transition-colors"
            style={{ 
              backgroundColor: colors.bgInput,
              borderColor: colors.border,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
            }}
          />
          <button
            onClick={() => {
              onStartMonitoring();
              if (!isMonitoring && botCount > 0) {
                toast.info('Memulai monitoring...');
              } else if (isMonitoring) {
                toast.warning('Monitoring dihentikan');
              }
            }}
            disabled={botCount === 0}
            className={`
              btn-micro btn-ripple px-6 py-3 rounded-lg font-semibold flex items-center gap-2
              ${botCount === 0 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : isMonitoring
                  ? 'bg-red-500 text-white btn-danger'
                  : 'text-white btn-success'
              }
            `}
            style={{ 
              backgroundColor: botCount === 0 ? undefined : isMonitoring ? undefined : colors.accent 
            }}
          >
            <Play size={18} fill="currentColor" />
            {isMonitoring ? 'Stop' : 'Start Monitoring'}
          </button>
        </div>

        {isMonitoring && (
          <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: colors.info }}>
            <ExternalLink size={14} />
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Buka Live Chat di YouTube
            </a>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare size={20} />}
          value={stats.totalChat}
          label="Total Chat"
          color={colors.info}
          trend={{ value: 12, up: true }}
        />
        <StatCard
          icon={<ShieldAlert size={20} />}
          value={stats.spamDetected}
          label="Spam Detected"
          color={colors.danger}
          trend={{ value: 8, up: false }}
        />
        <StatCard
          icon={<Zap size={20} />}
          value={stats.actionsTaken}
          label="Actions Taken"
          color={colors.success}
          trend={{ value: 15, up: true }}
        />
        <StatCard
          icon={<Activity size={20} />}
          value={stats.quotaUsed}
          label="API Calls"
          color={colors.warning}
        />
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Getting Started */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <span>🚀</span> Cara Menggunakan
          </h3>
          <ol className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
            <li className="flex items-start gap-2">
              <span className="font-bold" style={{ color: colors.accent }}>1.</span>
              Pastikan bot sudah ditambahkan sebagai moderator di channel target
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold" style={{ color: colors.accent }}>2.</span>
              Paste link live streaming YouTube di atas
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold" style={{ color: colors.accent }}>3.</span>
              Klik Start Monitoring - spam akan terdeteksi otomatis
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold" style={{ color: colors.accent }}>4.</span>
              Aktifkan Auto-Delete di Settings untuk menghapus spam otomatis
            </li>
          </ol>
        </div>

        {/* Recent Activity */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <span>🕐</span> Recent Activity
          </h3>
          <div className="space-y-3">
            {stats.spamDetected > 0 ? (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    🗑️
                  </span>
                  <div className="flex-1">
                    <p style={{ color: colors.textPrimary }}>Spam deleted</p>
                    <p style={{ color: colors.textMuted }}>Just now</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Belum ada aktivitas. Mulai monitoring untuk melihat aktivitas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
