/**
 * Themes Page - Custom theme selector
 */
import React from 'react';
import { useTheme, ThemePreset } from '../contexts/ThemeContext';
import { Check, Palette, Moon, Sun, Sparkles } from 'lucide-react';

const ThemesPage: React.FC = () => {
  const { theme, colors, setTheme, availableThemes } = useTheme();

  // Theme info
  const themeInfo: Record<ThemePreset, { name: string; description: string; icon: React.ReactNode; preview: string[] }> = {
    dark: {
      name: 'Dark',
      description: 'Tema gelap klasik dengan aksen merah',
      icon: <Moon size={20} />,
      preview: ['#0f0f0f', '#1a1a1a', '#ef4444'],
    },
    light: {
      name: 'Light',
      description: 'Tema terang untuk penggunaan siang hari',
      icon: <Sun size={20} />,
      preview: ['#f8fafc', '#ffffff', '#ef4444'],
    },
    midnight: {
      name: 'Midnight',
      description: 'Biru gelap dengan nuansa malam',
      icon: <Sparkles size={20} />,
      preview: ['#0a0a1a', '#12122a', '#6366f1'],
    },
    emerald: {
      name: 'Emerald',
      description: 'Hijau zamrud yang menenangkan',
      icon: <Palette size={20} />,
      preview: ['#0a1410', '#0f1f18', '#10b981'],
    },
    purple: {
      name: 'Purple',
      description: 'Ungu elegan dan misterius',
      icon: <Palette size={20} />,
      preview: ['#0f0a14', '#1a1020', '#a855f7'],
    },
    sunset: {
      name: 'Sunset',
      description: 'Oranye hangat seperti matahari terbenam',
      icon: <Palette size={20} />,
      preview: ['#140a0a', '#201010', '#f97316'],
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
          <Palette size={28} />
          Themes
        </h1>
        <p style={{ color: colors.textMuted }}>
          Pilih tema yang sesuai dengan preferensi kamu
        </p>
      </div>

      {/* Current Theme */}
      <div 
        className="p-5 rounded-xl"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Tema Aktif
        </h2>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            {themeInfo[theme].icon}
          </div>
          <div>
            <p className="font-medium" style={{ color: colors.textPrimary }}>
              {themeInfo[theme].name}
            </p>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {themeInfo[theme].description}
            </p>
          </div>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableThemes.map((themeKey) => {
          const info = themeInfo[themeKey];
          const isActive = theme === themeKey;

          return (
            <button
              key={themeKey}
              onClick={() => setTheme(themeKey)}
              className={`
                p-5 rounded-xl text-left transition-all duration-200
                ${isActive ? 'ring-2' : 'hover:scale-[1.02]'}
              `}
              style={{ 
                backgroundColor: colors.bgCard,
                ringColor: isActive ? colors.accent : 'transparent',
              }}
            >
              {/* Preview Colors */}
              <div className="flex gap-2 mb-4">
                {info.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Theme Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    {info.name}
                    {isActive && (
                      <span 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.success }}
                      >
                        <Check size={12} className="text-white" />
                      </span>
                    )}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    {info.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Color Preview */}
      <div 
        className="p-5 rounded-xl"
        style={{ backgroundColor: colors.bgCard }}
      >
        <h2 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: 'Accent', color: colors.accent },
            { name: 'Success', color: colors.success },
            { name: 'Warning', color: colors.warning },
            { name: 'Danger', color: colors.danger },
            { name: 'Info', color: colors.info },
            { name: 'Text', color: colors.textPrimary },
          ].map((item) => (
            <div key={item.name} className="text-center">
              <div 
                className="w-full h-12 rounded-lg mb-2"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {item.name}
              </p>
              <p className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                {item.color}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemesPage;
