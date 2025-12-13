/**
 * Bots Page - Bot manager untuk user
 */
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Bot, ExternalLink, Info, RefreshCw } from 'lucide-react';
import BotManager from '../components/BotManager';

const BotsPage: React.FC = () => {
  const { colors } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
          <Bot size={28} style={{ color: colors.info }} />
          Bot Manager
        </h1>
        <p style={{ color: colors.textMuted }}>
          Kelola bot yang tersedia untuk moderasi channel kamu
        </p>
      </div>

      {/* Info Card */}
      <div 
        className="p-5 rounded-xl"
        style={{ backgroundColor: `${colors.info}15`, borderLeft: `4px solid ${colors.info}` }}
      >
        <div className="flex items-start gap-3">
          <Info size={20} style={{ color: colors.info }} />
          <div>
            <p className="font-medium" style={{ color: colors.info }}>
              Cara menambahkan bot sebagai moderator
            </p>
            <ol className="text-sm mt-2 space-y-1" style={{ color: colors.textSecondary }}>
              <li>1. Klik "Open Channel" pada bot yang ingin digunakan</li>
              <li>2. Buka YouTube Studio → Settings → Community → Moderators</li>
              <li>3. Tambahkan channel bot sebagai moderator</li>
              <li>4. Kembali ke web app dan mulai monitoring</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Bot Manager Component */}
      <BotManager isCollapsible={false} defaultExpanded={true} />
    </div>
  );
};

export default BotsPage;
