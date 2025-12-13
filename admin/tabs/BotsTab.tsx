/**
 * Bots Tab - Manage bot tokens for web app
 */
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Bot, X, Eye, EyeOff, Power, AlertTriangle } from 'lucide-react';

// Firebase Config
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDtDlYCdA07dTwU3paVJHo21PMt-cCU55I',
  projectId: 'yt-bot-defend',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

interface BotToken {
  _id?: string;
  name: string;
  channel_id: string;
  channel_url?: string;
  avatar_url?: string;
  access_token: string;
  refresh_token: string;
  enabled: boolean;
  created_at: string;
}

// Helper functions
function firestoreToDict(doc: any): Record<string, any> {
  const fields = doc.fields || {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields) as [string, any][]) {
    if ('stringValue' in value) result[key] = value.stringValue;
    else if ('integerValue' in value) result[key] = parseInt(value.integerValue);
    else if ('booleanValue' in value) result[key] = value.booleanValue;
    else if ('doubleValue' in value) result[key] = value.doubleValue;
  }
  if (doc.name) result._id = doc.name.split('/').pop();
  return result;
}

function dictToFirestore(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (typeof value === 'number') fields[key] = Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return fields;
}

const BotsTab: React.FC = () => {
  const [bots, setBots] = useState<BotToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/webapp_bots?key=${FIREBASE_CONFIG.apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const botList = (data.documents || []).map(firestoreToDict) as BotToken[];
        setBots(botList);
      }
    } catch (e) {
      console.error('Load bots error:', e);
    }
    setLoading(false);
  };

  const toggleBot = async (bot: BotToken) => {
    try {
      const url = `${BASE_URL}/webapp_bots/${bot._id}?key=${FIREBASE_CONFIG.apiKey}&updateMask.fieldPaths=enabled`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: dictToFirestore({ enabled: !bot.enabled }) }),
      });
      if (response.ok) {
        setBots(prev => prev.map(b => b._id === bot._id ? { ...b, enabled: !b.enabled } : b));
      }
    } catch (e) {
      console.error('Toggle bot error:', e);
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('Yakin hapus bot ini?')) return;
    try {
      const url = `${BASE_URL}/webapp_bots/${botId}?key=${FIREBASE_CONFIG.apiKey}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok || response.status === 404) {
        setBots(prev => prev.filter(b => b._id !== botId));
      }
    } catch (e) {
      console.error('Delete bot error:', e);
    }
  };

  const toggleShowToken = (botId: string) => {
    setShowTokens(prev => ({ ...prev, [botId]: !prev[botId] }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Bot Tokens</h2>
        <div className="flex gap-2">
          <button
            onClick={loadBots}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Tambah Bot
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-300">
          💡 Bot yang ditambahkan di sini akan otomatis muncul di web app. 
          Pastikan bot sudah di-add sebagai moderator di channel target.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : bots.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Bot size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 mb-4">Belum ada bot</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm"
          >
            Tambah Bot Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bots.map((bot) => (
            <div
              key={bot._id}
              className={`bg-gray-800 rounded-xl p-4 border ${
                bot.enabled ? 'border-emerald-900/50' : 'border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {bot.avatar_url ? (
                    <img src={bot.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <Bot size={24} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {bot.name || 'Unnamed Bot'}
                      {bot.enabled ? (
                        <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded">AKTIF</span>
                      ) : (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">NONAKTIF</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">Channel ID: {bot.channel_id || '-'}</p>
                    <p className="text-xs text-gray-500">Ditambahkan: {new Date(bot.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleShowToken(bot._id!)}
                    className="p-2 text-gray-400 hover:text-white rounded"
                    title={showTokens[bot._id!] ? 'Sembunyikan Token' : 'Lihat Token'}
                  >
                    {showTokens[bot._id!] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    onClick={() => toggleBot(bot)}
                    className={`p-2 rounded ${bot.enabled ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-gray-400 hover:bg-gray-700'}`}
                    title={bot.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    <Power size={18} />
                  </button>
                  <button
                    onClick={() => deleteBot(bot._id!)}
                    className="p-2 text-red-400 hover:bg-red-900/30 rounded"
                    title="Hapus Bot"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Token Details */}
              {showTokens[bot._id!] && (
                <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Access Token:</p>
                  <code className="text-xs text-gray-300 break-all block mb-2">
                    {bot.access_token?.slice(0, 50)}...
                  </code>
                  <p className="text-xs text-gray-500 mb-1">Refresh Token:</p>
                  <code className="text-xs text-gray-300 break-all block">
                    {bot.refresh_token?.slice(0, 50)}...
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Bot Modal */}
      {showAddModal && (
        <AddBotModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadBots();
          }}
        />
      )}
    </div>
  );
};


// Add Bot Modal Component
interface AddBotModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddBotModal: React.FC<AddBotModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'json' | 'manual'>('json');
  const [jsonInput, setJsonInput] = useState('');
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseJsonToken = (json: string): Partial<BotToken> | null => {
    try {
      const data = JSON.parse(json);
      
      // Extract channel info (support multiple formats)
      const channelInfo = data.channel_info || {};
      const channelTitle = channelInfo.snippet?.title || channelInfo.title || data.name || 'Bot';
      const channelId = channelInfo.id || data.channel_id || '';
      const channelUrl = channelInfo.snippet?.customUrl 
        ? `https://youtube.com/${channelInfo.snippet.customUrl}` 
        : channelInfo.url || '';
      const avatarUrl = channelInfo.snippet?.thumbnails?.default?.url || channelInfo.avatar || '';
      
      // Format 1: Direct token format
      if (data.access_token && data.refresh_token) {
        return {
          name: channelTitle,
          channel_id: channelId,
          channel_url: channelUrl,
          avatar_url: avatarUrl,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        };
      }
      
      // Format 2: Nested tokens format (from Python tools)
      if (data.tokens?.access_token) {
        return {
          name: channelTitle,
          channel_id: channelId,
          channel_url: channelUrl,
          avatar_url: avatarUrl,
          access_token: data.tokens.access_token,
          refresh_token: data.tokens.refresh_token,
        };
      }
      
      return null;
    } catch (e) {
      console.error('Parse JSON error:', e);
      return null;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    let botData: Partial<BotToken>;

    if (mode === 'json') {
      const parsed = parseJsonToken(jsonInput);
      if (!parsed) {
        setError('Format JSON tidak valid. Pastikan berisi access_token dan refresh_token.');
        setLoading(false);
        return;
      }
      botData = parsed;
    } else {
      if (!accessToken || !refreshToken) {
        setError('Access Token dan Refresh Token wajib diisi.');
        setLoading(false);
        return;
      }
      botData = {
        name: name || 'Bot',
        channel_id: channelId,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    }

    try {
      const botId = `bot_${Date.now()}`;
      const url = `${BASE_URL}/webapp_bots/${botId}?key=${FIREBASE_CONFIG.apiKey}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: dictToFirestore({
            ...botData,
            enabled: true,
            created_at: new Date().toISOString(),
          }),
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        setError('Gagal menyimpan bot. Coba lagi.');
      }
    } catch (e) {
      setError('Error: ' + (e as Error).message);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold">Tambah Bot Baru</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('json')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                mode === 'json' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Paste JSON
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                mode === 'manual' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Input Manual
            </button>
          </div>

          {mode === 'json' ? (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Paste Token JSON (dari file *_token.json)
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"access_token": "...", "refresh_token": "...", "channel_info": {...}}'
                className="w-full h-40 bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-white font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bisa paste langsung dari file token yang di-generate Python tools
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nama Bot</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bot Moderator 1"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Channel ID (opsional)</label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UC..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Access Token *</label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="ya29...."
                  className="w-full h-20 bg-gray-900 border border-gray-600 rounded-lg p-2 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Refresh Token *</label>
                <textarea
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="1//..."
                  className="w-full h-20 bg-gray-900 border border-gray-600 rounded-lg p-2 text-white font-mono text-xs"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
              <AlertTriangle size={16} className="text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Bot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotsTab;
