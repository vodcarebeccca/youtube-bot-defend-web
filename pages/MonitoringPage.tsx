/**
 * Monitoring Page - Live chat monitoring dengan moderation log
 */
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Shield, 
  Play, 
  Square, 
  Wifi, 
  WifiOff,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Zap,
  Clock,
  ShieldCheck,
  ShieldX,
  Crown,
} from 'lucide-react';
import ModerationLog from '../components/ModerationLog';
import { ModerationEntry, FilterType, ModeratorStatus } from '../types';

interface MonitoringPageProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  isMonitoring: boolean;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  moderationLog: ModerationEntry[];
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  onDelete: (id: string, entry?: ModerationEntry) => void;
  onTimeout: (userId: string, entry?: ModerationEntry) => void;
  onBan: (userId: string, entry?: ModerationEntry) => void;
  stats: {
    totalChat: number;
    spamDetected: number;
    actionsTaken: number;
  };
  modStatus: ModeratorStatus | null;
  pollingInterval: number;
  botCount: number;
}

const MonitoringPage: React.FC<MonitoringPageProps> = ({
  videoUrl,
  setVideoUrl,
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring,
  moderationLog,
  filter,
  setFilter,
  onDelete,
  onTimeout,
  onBan,
  stats,
  modStatus,
  pollingInterval,
  botCount,
}) => {
  const { colors } = useTheme();

  // Extract video ID for YouTube link
  const getYouTubeUrl = () => {
    const match = videoUrl.match(/(?:v=|\/live\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/watch?v=${match[1]}` : '';
  };

  // Mini stat component
  const MiniStat = ({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) => (
    <div className="flex items-center gap-3 px-4 py-2">
      <span style={{ color: colors.textMuted }}>{icon}</span>
      <div>
        <p className="font-semibold" style={{ color: colors.textPrimary }}>{value}</p>
        <p className="text-xs" style={{ color: colors.textMuted }}>{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
            <Shield size={28} style={{ color: colors.accent }} />
            Live Monitoring
          </h1>
          <p style={{ color: colors.textMuted }}>
            Monitor dan moderasi live chat secara real-time
          </p>
        </div>

        {/* Status Badge */}
        {isMonitoring && (
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ backgroundColor: `${colors.success}20` }}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: colors.success }} />
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: colors.success }} />
            </span>
            <span style={{ color: colors.success }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Connection Card */}
      <div 
        className="p-5 rounded-xl"
        style={{ backgroundColor: colors.bgCard }}
      >
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
            onClick={isMonitoring ? onStopMonitoring : onStartMonitoring}
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
            {isMonitoring ? (
              <><Square size={18} fill="currentColor" /> Stop</>
            ) : (
              <><Play size={18} fill="currentColor" /> Start</>
            )}
          </button>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span 
              className="flex items-center gap-1.5"
              style={{ color: isMonitoring ? colors.success : colors.textMuted }}
            >
              {isMonitoring ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isMonitoring ? 'MONITORING AKTIF' : 'OFFLINE'}
            </span>
            {isMonitoring && (
              <>
                <span style={{ color: colors.textMuted }}>Poll: {pollingInterval}ms</span>
                {getYouTubeUrl() && (
                  <a 
                    href={getYouTubeUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                    style={{ color: colors.info }}
                  >
                    <ExternalLink size={14} />
                    Buka di YouTube
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Moderator Status Banner */}
      {modStatus && isMonitoring && (
        <div 
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ 
            backgroundColor: modStatus.isOwner 
              ? `${colors.info}15` 
              : modStatus.isModerator 
                ? `${colors.success}15` 
                : `${colors.danger}15`,
            borderLeft: `4px solid ${modStatus.isOwner ? colors.info : modStatus.isModerator ? colors.success : colors.danger}`
          }}
        >
          {modStatus.isOwner ? (
            <Crown size={20} style={{ color: colors.info }} />
          ) : modStatus.isModerator ? (
            <ShieldCheck size={20} style={{ color: colors.success }} />
          ) : (
            <ShieldX size={20} style={{ color: colors.danger }} />
          )}
          <div>
            <p className="font-medium" style={{ 
              color: modStatus.isOwner ? colors.info : modStatus.isModerator ? colors.success : colors.danger 
            }}>
              {modStatus.isOwner 
                ? '👑 Bot adalah OWNER channel' 
                : modStatus.isModerator 
                  ? '✅ Bot adalah Moderator' 
                  : '⚠️ Bot Bukan Moderator'}
            </p>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {modStatus.isOwner || modStatus.isModerator
                ? `${modStatus.botName} bisa menghapus chat dan ban user.`
                : `${modStatus.botName} tidak punya akses moderator. Auto-delete tidak akan berfungsi.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Mini Stats Bar */}
      {isMonitoring && (
        <div 
          className="rounded-xl flex divide-x overflow-hidden"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
        >
          <MiniStat icon={<MessageSquare size={18} />} value={stats.totalChat} label="Total Chat" />
          <MiniStat icon={<ShieldAlert size={18} />} value={stats.spamDetected} label="Spam" />
          <MiniStat icon={<Zap size={18} />} value={stats.actionsTaken} label="Actions" />
          <MiniStat icon={<Clock size={18} />} value={formatDuration(0)} label="Duration" />
        </div>
      )}

      {/* Moderation Log */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: colors.bgCard }}
      >
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <h2 className="font-semibold" style={{ color: colors.textPrimary }}>
            📋 Moderation Log
          </h2>
        </div>
        <ModerationLog
          entries={moderationLog}
          filter={filter}
          setFilter={setFilter}
          onDelete={onDelete}
          onTimeout={onTimeout}
          onBan={onBan}
        />
      </div>
    </div>
  );
};

// Helper function
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default MonitoringPage;
