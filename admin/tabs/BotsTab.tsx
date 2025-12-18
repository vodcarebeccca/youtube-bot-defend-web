/**
 * Bots Tab - Manage bot tokens for web app
 */
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Bot, X, Eye, EyeOff, Power, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
  token_status?: 'valid' | 'invalid' | 'checking' | 'unknown';
  last_checked?: string;
}

// Google OAuth credentials - from environment variables (MUST match Python tools)
// Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET in Vercel Environment Variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';

// Test token validity by trying to refresh
async function testTokenValidity(refreshToken: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (response.ok) {
      return { valid: true };
    } else {
      const errorData = await response.json();
      return { 
        valid: false, 
        error: errorData.error_description || errorData.error || 'Token invalid' 
      };
    }
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
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
  const [tokenStatus, setTokenStatus] = useState<Record<string, 'valid' | 'invalid' | 'checking' | 'unknown'>>({});

  useEffect(() => {
    loadBots();
  }, []);

  // Test single bot token
  const testBotToken = async (bot: BotToken) => {
    if (!bot._id || !bot.refresh_token) return;
    
    setTokenStatus(prev => ({ ...prev, [bot._id!]: 'checking' }));
    
    const result = await testTokenValidity(bot.refresh_token);
    setTokenStatus(prev => ({ ...prev, [bot._id!]: result.valid ? 'valid' : 'invalid' }));
    
    if (!result.valid) {
      console.log(`[BotsTab] Token invalid for ${bot.name}: ${result.error}`);
    }
  };

  // Test all bot tokens
  const testAllTokens = async () => {
    for (const bot of bots) {
      await testBotToken(bot);
    }
  };

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
            onClick={testAllTokens}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            title="Test semua token"
          >
            <CheckCircle size={16} /> Test All
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
                    {bot.channel_url ? (
                      <a href={bot.channel_url} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                        🔗 {bot.channel_url}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">Channel ID: {bot.channel_id || '-'}</p>
                    )}
                    <p className="text-xs text-gray-500">Ditambahkan: {new Date(bot.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Token Status Indicator */}
                  {tokenStatus[bot._id!] === 'checking' && (
                    <div className="p-2" title="Sedang mengecek...">
                      <Loader2 size={18} className="text-blue-400 animate-spin" />
                    </div>
                  )}
                  {tokenStatus[bot._id!] === 'valid' && (
                    <div className="p-2" title="Token Valid ✓">
                      <CheckCircle size={18} className="text-emerald-400" />
                    </div>
                  )}
                  {tokenStatus[bot._id!] === 'invalid' && (
                    <div className="p-2" title="Token Invalid / Expired">
                      <XCircle size={18} className="text-red-400" />
                    </div>
                  )}
                  <button
                    onClick={() => testBotToken(bot)}
                    className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"
                    title="Test Token"
                  >
                    <RefreshCw size={18} />
                  </button>
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
                  {/* Token Status Banner */}
                  {tokenStatus[bot._id!] && (
                    <div className={`flex items-center gap-2 p-2 rounded mb-3 ${
                      tokenStatus[bot._id!] === 'valid' 
                        ? 'bg-emerald-900/20 border border-emerald-900/50' 
                        : tokenStatus[bot._id!] === 'invalid'
                          ? 'bg-red-900/20 border border-red-900/50'
                          : 'bg-blue-900/20 border border-blue-900/50'
                    }`}>
                      {tokenStatus[bot._id!] === 'checking' && (
                        <>
                          <Loader2 size={14} className="text-blue-400 animate-spin" />
                          <span className="text-xs text-blue-300">Mengecek token...</span>
                        </>
                      )}
                      {tokenStatus[bot._id!] === 'valid' && (
                        <>
                          <CheckCircle size={14} className="text-emerald-400" />
                          <span className="text-xs text-emerald-300">✓ Token Valid - Refresh token berfungsi dengan baik</span>
                        </>
                      )}
                      {tokenStatus[bot._id!] === 'invalid' && (
                        <>
                          <XCircle size={14} className="text-red-400" />
                          <span className="text-xs text-red-300">✗ Token Invalid - Perlu login ulang via Python tools</span>
                        </>
                      )}
                    </div>
                  )}
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


// OAuth scopes for bot (live chat moderation)
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
].join(' ');

// Get OAuth redirect URI
const getRedirectUri = () => {
  return `${window.location.origin}/oauth/callback`;
};

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: getRedirectUri(),
      }),
    });

    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      console.error('Token exchange error:', error);
      return null;
    }
  } catch (e) {
    console.error('Token exchange exception:', e);
    return null;
  }
}

// Get channel info from YouTube API
async function getChannelInfo(accessToken: string): Promise<{
  id: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
} | null> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          customUrl: channel.snippet.customUrl,
          thumbnailUrl: channel.snippet.thumbnails?.default?.url,
        };
      }
    }
    return null;
  } catch (e) {
    console.error('Get channel info error:', e);
    return null;
  }
}

// Add Bot Modal Component
interface AddBotModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddBotModal: React.FC<AddBotModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'oauth' | 'json' | 'manual'>('oauth');
  const [jsonInput, setJsonInput] = useState('');
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'waiting' | 'processing' | 'success' | 'error'>('idle');

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'oauth_callback' && event.data?.code) {
        setOauthStatus('processing');
        setError(null);
        
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(event.data.code);
        if (!tokens || !tokens.refresh_token) {
          setError('Gagal mendapatkan token. Pastikan akun belum pernah di-authorize sebelumnya.');
          setOauthStatus('error');
          return;
        }
        
        // Get channel info
        const channelInfo = await getChannelInfo(tokens.access_token);
        if (!channelInfo) {
          setError('Gagal mendapatkan info channel.');
          setOauthStatus('error');
          return;
        }
        
        // Save bot to Firebase
        try {
          const botId = `bot_${Date.now()}`;
          const url = `${BASE_URL}/webapp_bots/${botId}?key=${FIREBASE_CONFIG.apiKey}`;
          
          const botData = {
            name: channelInfo.title,
            channel_id: channelInfo.id,
            channel_url: channelInfo.customUrl ? `https://youtube.com/${channelInfo.customUrl}` : `https://youtube.com/channel/${channelInfo.id}`,
            avatar_url: channelInfo.thumbnailUrl || '',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            enabled: true,
            created_at: new Date().toISOString(),
          };
          
          const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: dictToFirestore(botData) }),
          });
          
          if (response.ok) {
            setOauthStatus('success');
            setTimeout(() => {
              onSuccess();
            }, 1500);
          } else {
            setError('Gagal menyimpan bot ke database.');
            setOauthStatus('error');
          }
        } catch (e) {
          setError('Error: ' + (e as Error).message);
          setOauthStatus('error');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  // Start OAuth flow
  const startOAuthLogin = () => {
    setOauthStatus('waiting');
    setError(null);
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', getRedirectUri());
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', OAUTH_SCOPES);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh_token
    authUrl.searchParams.set('state', 'admin_add_bot');
    
    // Open popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      authUrl.toString(),
      'oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );
  };

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
        channel_url: channelUrl,
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
              onClick={() => setMode('oauth')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                mode === 'oauth' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              🔐 Login Google
            </button>
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
              Manual
            </button>
          </div>

          {/* OAuth Login Mode */}
          {mode === 'oauth' && (
            <div className="text-center py-4">
              {oauthStatus === 'idle' && (
                <>
                  <p className="text-gray-400 mb-4">
                    Login dengan akun YouTube yang akan dijadikan bot moderator.
                  </p>
                  <button
                    onClick={startOAuthLogin}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Login with Google
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    Pastikan akun YouTube sudah memiliki channel
                  </p>
                </>
              )}
              
              {oauthStatus === 'waiting' && (
                <div className="py-4">
                  <Loader2 size={32} className="mx-auto text-blue-400 animate-spin mb-3" />
                  <p className="text-gray-300">Menunggu login di popup...</p>
                  <p className="text-xs text-gray-500 mt-2">Selesaikan login di jendela popup</p>
                </div>
              )}
              
              {oauthStatus === 'processing' && (
                <div className="py-4">
                  <Loader2 size={32} className="mx-auto text-emerald-400 animate-spin mb-3" />
                  <p className="text-gray-300">Memproses token...</p>
                </div>
              )}
              
              {oauthStatus === 'success' && (
                <div className="py-4">
                  <CheckCircle size={48} className="mx-auto text-emerald-400 mb-3" />
                  <p className="text-emerald-300 font-medium">Bot berhasil ditambahkan!</p>
                </div>
              )}
              
              {oauthStatus === 'error' && (
                <div className="py-4">
                  <XCircle size={48} className="mx-auto text-red-400 mb-3" />
                  <p className="text-red-300 mb-2">Gagal menambahkan bot</p>
                  <button
                    onClick={() => setOauthStatus('idle')}
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Coba lagi
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'json' && (
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
          )}

          {mode === 'manual' && (
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
                <label className="block text-sm text-gray-400 mb-1">URL Channel YouTube *</label>
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://youtube.com/@username atau https://youtube.com/channel/UC..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL ini akan ditampilkan di web app agar user bisa add bot sebagai moderator
                </p>
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

          {/* Buttons - hide for OAuth mode when processing */}
          {(mode !== 'oauth' || oauthStatus === 'idle' || oauthStatus === 'error') && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                {mode === 'oauth' ? 'Tutup' : 'Batal'}
              </button>
              {mode !== 'oauth' && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Bot'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotsTab;
