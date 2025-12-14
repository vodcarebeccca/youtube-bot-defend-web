/**
 * Settings Page - App settings dan preferences
 */
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings, 
  Zap, 
  Shield, 
  Bell, 
  Volume2,
  Trash2,
  Download,
  Info,
  ExternalLink,
  MessageSquare,
  Send,
  CheckCircle,
  Bug,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import { AppSettings } from '../types';
import { isAIDetectionAvailable, getProviderName } from '../services/aiDetection';
import { submitFeedback } from '../services/firebaseService';

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onExportLog: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  setSettings,
  onExportLog,
}) => {
  const { colors } = useTheme();
  
  // Feedback state
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    
    setFeedbackSending(true);
    const success = await submitFeedback(feedbackType, feedbackMessage, feedbackEmail);
    setFeedbackSending(false);
    
    if (success) {
      setFeedbackSent(true);
      setFeedbackMessage('');
      setFeedbackEmail('');
      setTimeout(() => setFeedbackSent(false), 3000);
    }
  };

  // Toggle component
  const Toggle = ({ 
    enabled, 
    onChange, 
    color = colors.accent 
  }: { 
    enabled: boolean; 
    onChange: (v: boolean) => void;
    color?: string;
  }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
      `}
      style={{ backgroundColor: enabled ? color : colors.bgTertiary }}
    >
      <span
        className={`
          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  // Setting row component
  const SettingRow = ({ 
    icon, 
    title, 
    description, 
    children,
    danger = false,
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description: string;
    children: React.ReactNode;
    danger?: boolean;
  }) => (
    <div 
      className="flex items-center justify-between p-4 rounded-lg"
      style={{ backgroundColor: colors.bgTertiary }}
    >
      <div className="flex items-start gap-3">
        <span style={{ color: danger ? colors.danger : colors.textMuted }}>
          {icon}
        </span>
        <div>
          <p className="font-medium" style={{ color: danger ? colors.danger : colors.textPrimary }}>
            {title}
          </p>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
          <Settings size={28} />
          Settings
        </h1>
        <p style={{ color: colors.textMuted }}>
          Konfigurasi preferensi dan pengaturan aplikasi
        </p>
      </div>

      {/* Auto Actions */}
      <div 
        className="p-5 rounded-xl space-y-3"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
          <Zap size={20} style={{ color: colors.warning }} />
          Auto Actions
        </h2>

        <SettingRow
          icon={<Trash2 size={18} />}
          title="Auto-Delete"
          description="Hapus pesan spam secara otomatis"
          danger={settings.autoDelete}
        >
          <Toggle 
            enabled={settings.autoDelete} 
            onChange={(v) => setSettings(s => ({ ...s, autoDelete: v }))}
            color={colors.danger}
          />
        </SettingRow>

        <SettingRow
          icon={<Shield size={18} />}
          title="Auto-Timeout"
          description="Timeout 5 menit untuk spammer"
        >
          <Toggle 
            enabled={settings.autoTimeout} 
            onChange={(v) => setSettings(s => ({ ...s, autoTimeout: v }))}
            color={colors.warning}
          />
        </SettingRow>

        <SettingRow
          icon={<Shield size={18} />}
          title="Auto-Ban"
          description="Ban permanen untuk spammer berulang"
          danger={settings.autoBan}
        >
          <Toggle 
            enabled={settings.autoBan} 
            onChange={(v) => setSettings(s => ({ ...s, autoBan: v }))}
            color={colors.danger}
          />
        </SettingRow>
      </div>

      {/* Detection Settings */}
      <div 
        className="p-5 rounded-xl space-y-4"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
          <Shield size={20} style={{ color: colors.info }} />
          Detection Settings
        </h2>

        {/* AI Detection */}
        <SettingRow
          icon={<span>🤖</span>}
          title="AI Detection"
          description={isAIDetectionAvailable() 
            ? `Menggunakan ${getProviderName()}` 
            : 'API key tidak dikonfigurasi'
          }
        >
          <Toggle 
            enabled={settings.aiDetectionEnabled && isAIDetectionAvailable()} 
            onChange={(v) => setSettings(s => ({ ...s, aiDetectionEnabled: v }))}
            color={colors.info}
          />
        </SettingRow>

        {/* Spam Threshold */}
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.bgTertiary }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium" style={{ color: colors.textPrimary }}>
                Spam Threshold
              </p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Skor minimum untuk dianggap spam (0-100)
              </p>
            </div>
            <span 
              className="text-lg font-bold"
              style={{ color: colors.accent }}
            >
              {settings.spamThreshold}%
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="90"
            value={settings.spamThreshold}
            onChange={(e) => setSettings(s => ({ ...s, spamThreshold: parseInt(e.target.value) }))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ 
              background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${(settings.spamThreshold - 20) / 70 * 100}%, ${colors.bgSecondary} ${(settings.spamThreshold - 20) / 70 * 100}%, ${colors.bgSecondary} 100%)` 
            }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: colors.textMuted }}>
            <span>Sensitif (20)</span>
            <span>Ketat (90)</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div 
        className="p-5 rounded-xl space-y-3"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
          <Bell size={20} style={{ color: colors.success }} />
          Notifications
        </h2>

        <SettingRow
          icon={<Volume2 size={18} />}
          title="Sound Notifications"
          description="Putar suara saat spam terdeteksi"
        >
          <Toggle 
            enabled={settings.soundEnabled} 
            onChange={(v) => setSettings(s => ({ ...s, soundEnabled: v }))}
            color={colors.success}
          />
        </SettingRow>
      </div>

      {/* Data & Export */}
      <div 
        className="p-5 rounded-xl space-y-3"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
          <Download size={20} style={{ color: colors.info }} />
          Data & Export
        </h2>

        <button
          onClick={onExportLog}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
          style={{ 
            backgroundColor: colors.bgTertiary,
            color: colors.textPrimary,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bgTertiary}
        >
          <Download size={18} />
          Export Moderation Log (JSON)
        </button>

        <p className="text-sm text-center" style={{ color: colors.textMuted }}>
          Data tersimpan di browser (localStorage). Tidak ada data yang dikirim ke server.
        </p>
      </div>

      {/* Feedback & Report */}
      <div 
        className="p-5 rounded-xl space-y-4"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
          <MessageSquare size={20} style={{ color: colors.info }} />
          Feedback & Report
        </h2>

        {feedbackSent ? (
          <div 
            className="flex items-center gap-3 p-4 rounded-lg"
            style={{ backgroundColor: colors.success + '20', color: colors.success }}
          >
            <CheckCircle size={24} />
            <div>
              <p className="font-medium">Terima kasih!</p>
              <p className="text-sm opacity-80">Feedback kamu sudah terkirim ke admin.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Feedback Type */}
            <div className="flex gap-2">
              {[
                { type: 'bug' as const, icon: <Bug size={16} />, label: 'Bug Report' },
                { type: 'feature' as const, icon: <Lightbulb size={16} />, label: 'Saran Fitur' },
                { type: 'general' as const, icon: <HelpCircle size={16} />, label: 'Umum' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setFeedbackType(item.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: feedbackType === item.type ? colors.accent : colors.bgTertiary,
                    color: feedbackType === item.type ? 'white' : colors.textSecondary,
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder={
                feedbackType === 'bug' 
                  ? 'Jelaskan bug yang kamu temukan...' 
                  : feedbackType === 'feature'
                  ? 'Fitur apa yang kamu inginkan?'
                  : 'Tulis pesan atau pertanyaan...'
              }
              className="w-full p-3 rounded-lg text-sm resize-none"
              style={{ 
                backgroundColor: colors.bgTertiary, 
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
              }}
              rows={4}
            />

            {/* Email (optional) */}
            <input
              type="email"
              value={feedbackEmail}
              onChange={(e) => setFeedbackEmail(e.target.value)}
              placeholder="Email (opsional, untuk balasan)"
              className="w-full p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: colors.bgTertiary, 
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
              }}
            />

            {/* Submit */}
            <button
              onClick={handleSubmitFeedback}
              disabled={!feedbackMessage.trim() || feedbackSending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: colors.accent,
                color: 'white',
              }}
            >
              {feedbackSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Kirim Feedback
                </>
              )}
            </button>
          </>
        )}

        <p className="text-xs text-center" style={{ color: colors.textMuted }}>
          Feedback akan dikirim ke admin untuk ditinjau.
        </p>
      </div>

      {/* About */}
      <div 
        className="p-5 rounded-xl"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
          <Info size={20} style={{ color: colors.textMuted }} />
          About
        </h2>

        <div className="space-y-2 text-sm">
          {[
            { label: 'Version', value: '2.0.0' },
            { label: 'Developer', value: 'ZIVER RFL' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between">
              <span style={{ color: colors.textMuted }}>{item.label}</span>
              <span style={{ color: colors.textSecondary }}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <a
            href="https://youtube-bot-defend-web.vercel.app/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm hover:underline"
            style={{ color: colors.info }}
          >
            <ExternalLink size={14} />
            Terms of Service
          </a>
          <a
            href="https://youtube-bot-defend-web.vercel.app/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm hover:underline"
            style={{ color: colors.info }}
          >
            <ExternalLink size={14} />
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
