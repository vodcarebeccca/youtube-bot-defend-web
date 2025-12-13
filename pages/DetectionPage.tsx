/**
 * Detection Page - Spam detection settings dan whitelist/blacklist
 */
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ListFilter, 
  Plus, 
  X, 
  Shield,
  Zap,
  UserCheck,
  UserX,
  MessageSquareWarning,
} from 'lucide-react';
import { AppSettings } from '../types';
import { isAIDetectionAvailable, getProviderName } from '../services/aiDetection';

interface DetectionPageProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const DetectionPage: React.FC<DetectionPageProps> = ({ settings, setSettings }) => {
  const { colors } = useTheme();
  const [newWhitelist, setNewWhitelist] = useState('');
  const [newBlacklist, setNewBlacklist] = useState('');
  const [newSpamWord, setNewSpamWord] = useState('');

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
      className="relative w-11 h-6 rounded-full transition-colors duration-200"
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

  // Add to list
  const addToWhitelist = () => {
    if (newWhitelist.trim() && !settings.whitelist.includes(newWhitelist.trim())) {
      setSettings(s => ({ ...s, whitelist: [...s.whitelist, newWhitelist.trim()] }));
      setNewWhitelist('');
    }
  };

  const addToBlacklist = () => {
    if (newBlacklist.trim() && !settings.blacklist.includes(newBlacklist.trim())) {
      setSettings(s => ({ ...s, blacklist: [...s.blacklist, newBlacklist.trim()] }));
      setNewBlacklist('');
    }
  };

  const addSpamWord = () => {
    if (newSpamWord.trim() && !settings.customSpamWords.includes(newSpamWord.trim())) {
      setSettings(s => ({ ...s, customSpamWords: [...s.customSpamWords, newSpamWord.trim()] }));
      setNewSpamWord('');
    }
  };

  // Remove from list
  const removeFromWhitelist = (item: string) => {
    setSettings(s => ({ ...s, whitelist: s.whitelist.filter(w => w !== item) }));
  };

  const removeFromBlacklist = (item: string) => {
    setSettings(s => ({ ...s, blacklist: s.blacklist.filter(b => b !== item) }));
  };

  const removeSpamWord = (item: string) => {
    setSettings(s => ({ ...s, customSpamWords: s.customSpamWords.filter(w => w !== item) }));
  };

  // Tag component
  const Tag = ({ text, onRemove, color }: { text: string; onRemove: () => void; color: string }) => (
    <span 
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {text}
      <button onClick={onRemove} className="hover:opacity-70">
        <X size={14} />
      </button>
    </span>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
          <ListFilter size={28} style={{ color: colors.accent }} />
          Spam Detection
        </h1>
        <p style={{ color: colors.textMuted }}>
          Konfigurasi deteksi spam dan kelola whitelist/blacklist
        </p>
      </div>

      {/* Detection Modules */}
      <div 
        className="p-5 rounded-xl space-y-4"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Shield size={20} style={{ color: colors.info }} />
          Detection Modules
        </h2>

        {/* AI Detection */}
        <div 
          className="flex items-center justify-between p-4 rounded-lg"
          style={{ backgroundColor: colors.bgTertiary }}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <p className="font-medium" style={{ color: colors.textPrimary }}>AI Detection</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {isAIDetectionAvailable() 
                  ? `Menggunakan ${getProviderName()} untuk deteksi lebih akurat` 
                  : 'API key tidak dikonfigurasi'
                }
              </p>
            </div>
          </div>
          <Toggle 
            enabled={settings.aiDetectionEnabled && isAIDetectionAvailable()} 
            onChange={(v) => setSettings(s => ({ ...s, aiDetectionEnabled: v }))}
            color={colors.info}
          />
        </div>

        {/* Spam Threshold */}
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.bgTertiary }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium" style={{ color: colors.textPrimary }}>Spam Threshold</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Skor minimum untuk dianggap spam
                </p>
              </div>
            </div>
            <span className="text-lg font-bold" style={{ color: colors.accent }}>
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
        </div>
      </div>

      {/* Whitelist & Blacklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Whitelist */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h2 className="font-semibold flex items-center gap-2 mb-2" style={{ color: colors.success }}>
            <UserCheck size={20} />
            Whitelist
          </h2>
          <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
            User yang di-whitelist tidak akan terdeteksi sebagai spam
          </p>

          {/* Add Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newWhitelist}
              onChange={(e) => setNewWhitelist(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToWhitelist()}
              placeholder="Username..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ 
                backgroundColor: colors.bgInput,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            />
            <button
              onClick={addToWhitelist}
              className="px-4 py-2 rounded-lg font-medium text-white"
              style={{ backgroundColor: colors.success }}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {settings.whitelist.length === 0 ? (
              <p className="text-sm" style={{ color: colors.textMuted }}>Belum ada whitelist</p>
            ) : (
              settings.whitelist.map((item) => (
                <Tag key={item} text={item} onRemove={() => removeFromWhitelist(item)} color={colors.success} />
              ))
            )}
          </div>
        </div>

        {/* Blacklist */}
        <div 
          className="p-5 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          <h2 className="font-semibold flex items-center gap-2 mb-2" style={{ color: colors.danger }}>
            <UserX size={20} />
            Blacklist
          </h2>
          <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
            User yang di-blacklist akan selalu dianggap spam
          </p>

          {/* Add Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newBlacklist}
              onChange={(e) => setNewBlacklist(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToBlacklist()}
              placeholder="Username..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ 
                backgroundColor: colors.bgInput,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            />
            <button
              onClick={addToBlacklist}
              className="px-4 py-2 rounded-lg font-medium text-white"
              style={{ backgroundColor: colors.danger }}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {settings.blacklist.length === 0 ? (
              <p className="text-sm" style={{ color: colors.textMuted }}>Belum ada blacklist</p>
            ) : (
              settings.blacklist.map((item) => (
                <Tag key={item} text={item} onRemove={() => removeFromBlacklist(item)} color={colors.danger} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Custom Spam Words */}
      <div 
        className="p-5 rounded-xl"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold flex items-center gap-2 mb-2" style={{ color: colors.warning }}>
          <MessageSquareWarning size={20} />
          Custom Spam Words
        </h2>
        <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
          Tambahkan kata-kata yang ingin dideteksi sebagai spam
        </p>

        {/* Add Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newSpamWord}
            onChange={(e) => setNewSpamWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSpamWord()}
            placeholder="Kata spam..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ 
              backgroundColor: colors.bgInput,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          />
          <button
            onClick={addSpamWord}
            className="px-4 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: colors.warning }}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {settings.customSpamWords.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textMuted }}>Belum ada custom spam words</p>
          ) : (
            settings.customSpamWords.map((item) => (
              <Tag key={item} text={item} onRemove={() => removeSpamWord(item)} color={colors.warning} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DetectionPage;
