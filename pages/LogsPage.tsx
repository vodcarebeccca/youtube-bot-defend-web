/**
 * Logs Page - Moderation log history
 */
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ScrollText, 
  Download,
  Trash2,
  Clock,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import ModerationLog from '../components/ModerationLog';
import { ModerationEntry, FilterType } from '../types';

interface LogsPageProps {
  moderationLog: ModerationEntry[];
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  onDelete: (id: string, entry?: ModerationEntry) => void;
  onTimeout: (userId: string, entry?: ModerationEntry) => void;
  onBan: (userId: string, entry?: ModerationEntry) => void;
  onExportLog: () => void;
}

const LogsPage: React.FC<LogsPageProps> = ({
  moderationLog,
  filter,
  setFilter,
  onDelete,
  onTimeout,
  onBan,
  onExportLog,
}) => {
  const { colors } = useTheme();

  // Calculate stats
  const stats = {
    total: moderationLog.length,
    deleted: moderationLog.filter(e => e.type === 'deleted').length,
    timeout: moderationLog.filter(e => e.type === 'timeout').length,
    banned: moderationLog.filter(e => e.type === 'banned').length,
    spam: moderationLog.filter(e => e.type === 'spam_detected').length,
  };

  // Stat card component
  const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) => (
    <div 
      className="p-4 rounded-xl"
      style={{ backgroundColor: colors.bgCard }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          <p className="text-sm" style={{ color: colors.textMuted }}>{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
            <ScrollText size={28} style={{ color: colors.accent }} />
            Moderation Log
          </h1>
          <p style={{ color: colors.textMuted }}>
            Riwayat semua aksi moderasi
          </p>
        </div>

        <button
          onClick={onExportLog}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ 
            backgroundColor: colors.bgCard,
            color: colors.textPrimary,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bgCard}
        >
          <Download size={18} />
          Export JSON
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Trash2 size={18} />}
          value={stats.deleted}
          label="Deleted"
          color={colors.danger}
        />
        <StatCard
          icon={<Clock size={18} />}
          value={stats.timeout}
          label="Timeout"
          color={colors.warning}
        />
        <StatCard
          icon={<Ban size={18} />}
          value={stats.banned}
          label="Banned"
          color="#a855f7"
        />
        <StatCard
          icon={<ShieldAlert size={18} />}
          value={stats.spam}
          label="Detected"
          color={colors.info}
        />
      </div>

      {/* Moderation Log */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: colors.bgCard }}
      >
        <ModerationLog
          entries={moderationLog}
          filter={filter}
          setFilter={setFilter}
          onDelete={onDelete}
          onTimeout={onTimeout}
          onBan={onBan}
        />
      </div>

      {/* Empty State */}
      {moderationLog.length === 0 && (
        <div 
          className="p-10 rounded-xl text-center"
          style={{ backgroundColor: colors.bgCard }}
        >
          <ScrollText size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
          <p className="font-medium" style={{ color: colors.textPrimary }}>
            Belum ada log moderasi
          </p>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Mulai monitoring untuk melihat aktivitas moderasi
          </p>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
