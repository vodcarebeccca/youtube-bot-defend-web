import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Download, Shield, Zap, UserPlus, UserMinus, Brain, MessageSquare } from 'lucide-react';
import { isAIDetectionAvailable, getProviderName } from '../services/aiDetection';

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClose: () => void;
  onExportLog: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, onClose, onExportLog }) => {
  const [newWhitelist, setNewWhitelist] = useState('');
  const [newBlacklist, setNewBlacklist] = useState('');
  const [newSpamWord, setNewSpamWord] = useState('');

  const addToWhitelist = () => {
    if (newWhitelist.trim()) {
      setSettings(s => ({ ...s, whitelist: [...s.whitelist, newWhitelist.trim()] }));
      setNewWhitelist('');
    }
  };

  const addToBlacklist = () => {
    if (newBlacklist.trim()) {
      setSettings(s => ({ ...s, blacklist: [...s.blacklist, newBlacklist.trim()] }));
      setNewBlacklist('');
    }
  };

  const removeFromWhitelist = (item: string) => {
    setSettings(s => ({ ...s, whitelist: s.whitelist.filter(w => w !== item) }));
  };

  const removeFromBlacklist = (item: string) => {
    setSettings(s => ({ ...s, blacklist: s.blacklist.filter(b => b !== item) }));
  };

  const addSpamWord = () => {
    if (newSpamWord.trim()) {
      const words = settings.customSpamWords || [];
      if (!words.includes(newSpamWord.trim().toLowerCase())) {
        setSettings(s => ({ ...s, customSpamWords: [...words, newSpamWord.trim().toLowerCase()] }));
      }
      setNewSpamWord('');
    }
  };

  const removeSpamWord = (word: string) => {
    setSettings(s => ({ ...s, customSpamWords: (s.customSpamWords || []).filter(w => w !== word) }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Auto Actions */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <Zap size={16} /> Auto Actions
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
                <div>
                  <span className="text-white font-medium">Auto Delete</span>
                  <p className="text-xs text-gray-500">Automatically delete spam messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoDelete}
                  onChange={(e) => setSettings(s => ({ ...s, autoDelete: e.target.checked }))}
                  className="w-5 h-5 accent-emerald-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
                <div>
                  <span className="text-white font-medium">Auto Timeout</span>
                  <p className="text-xs text-gray-500">5 minute timeout for spammers</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoTimeout}
                  onChange={(e) => setSettings(s => ({ ...s, autoTimeout: e.target.checked }))}
                  className="w-5 h-5 accent-amber-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
                <div>
                  <span className="text-white font-medium">Auto Ban</span>
                  <p className="text-xs text-red-400">⚠️ Permanently ban spammers</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoBan}
                  onChange={(e) => setSettings(s => ({ ...s, autoBan: e.target.checked }))}
                  className="w-5 h-5 accent-red-500"
                />
              </label>
            </div>
          </div>

          {/* Detection Settings */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <Shield size={16} /> Detection
            </h3>
            <div className="space-y-3">
              {/* Spam Threshold */}
              <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
                <label className="text-white font-medium">Spam Threshold: {settings.spamThreshold}</label>
                <p className="text-xs text-gray-500 mb-2">Lower = more sensitive (default: 50)</p>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={settings.spamThreshold}
                  onChange={(e) => setSettings(s => ({ ...s, spamThreshold: parseInt(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Sensitive (20)</span>
                  <span>Strict (90)</span>
                </div>
              </div>

              {/* AI Detection Toggle */}
              <label className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <Brain size={20} className="text-purple-500" />
                  <div>
                    <span className="text-white font-medium">AI Detection</span>
                    <p className="text-xs text-gray-500">
                      {isAIDetectionAvailable() 
                        ? `Using ${getProviderName()} for smarter detection`
                        : 'No AI provider configured'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.aiDetectionEnabled || false}
                  onChange={(e) => setSettings(s => ({ ...s, aiDetectionEnabled: e.target.checked }))}
                  className="w-5 h-5 accent-purple-500"
                  disabled={!isAIDetectionAvailable()}
                />
              </label>
              {settings.aiDetectionEnabled && isAIDetectionAvailable() && (
                <div className="p-2 bg-purple-900/20 border border-purple-900/50 rounded-lg">
                  <p className="text-xs text-purple-300">
                    🤖 AI ({getProviderName()}) akan menganalisis pesan yang tidak terdeteksi oleh pattern matching.
                  </p>
                </div>
              )}
              {!isAIDetectionAvailable() && (
                <div className="p-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400">
                    ⚠️ Set VITE_GEMINI_API_KEY atau VITE_GROQ_API_KEY di Vercel untuk mengaktifkan AI detection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Spam Words */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <MessageSquare size={16} /> Custom Spam Words
            </h3>
            <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Add your own spam keywords (saved locally)</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSpamWord}
                  onChange={(e) => setNewSpamWord(e.target.value)}
                  placeholder="e.g. judol, slot, gacor..."
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                  onKeyDown={(e) => e.key === 'Enter' && addSpamWord()}
                />
                <button onClick={addSpamWord} className="px-3 py-2 bg-orange-600 text-white rounded text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(settings.customSpamWords || []).map(word => (
                  <span key={word} className="flex items-center gap-1 bg-orange-900/30 text-orange-300 px-2 py-1 rounded text-xs">
                    {word}
                    <button onClick={() => removeSpamWord(word)} className="hover:text-white"><X size={12} /></button>
                  </span>
                ))}
                {(!settings.customSpamWords || settings.customSpamWords.length === 0) && (
                  <span className="text-xs text-gray-500">No custom words added</span>
                )}
              </div>
            </div>
          </div>

          {/* Whitelist */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <UserPlus size={16} /> Whitelist
            </h3>
            <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Users that will never be flagged as spam</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newWhitelist}
                  onChange={(e) => setNewWhitelist(e.target.value)}
                  placeholder="Username..."
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                  onKeyDown={(e) => e.key === 'Enter' && addToWhitelist()}
                />
                <button onClick={addToWhitelist} className="px-3 py-2 bg-emerald-600 text-white rounded text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.whitelist.map(item => (
                  <span key={item} className="flex items-center gap-1 bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded text-xs">
                    {item}
                    <button onClick={() => removeFromWhitelist(item)} className="hover:text-white"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Blacklist */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <UserMinus size={16} /> Blacklist
            </h3>
            <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Users that will always be flagged as spam</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBlacklist}
                  onChange={(e) => setNewBlacklist(e.target.value)}
                  placeholder="Username..."
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                  onKeyDown={(e) => e.key === 'Enter' && addToBlacklist()}
                />
                <button onClick={addToBlacklist} className="px-3 py-2 bg-red-600 text-white rounded text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.blacklist.map(item => (
                  <span key={item} className="flex items-center gap-1 bg-red-900/30 text-red-300 px-2 py-1 rounded text-xs">
                    {item}
                    <button onClick={() => removeFromBlacklist(item)} className="hover:text-white"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Export */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <Download size={16} /> Export
            </h3>
            <button
              onClick={onExportLog}
              className="w-full p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-white hover:border-gray-600 flex items-center justify-center gap-2"
            >
              <Download size={16} /> Export Spam Log (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
