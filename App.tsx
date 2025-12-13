import React, { useState, useEffect, useCallback, useRef } from 'react';
import StatsCards from './components/StatsCards';
import ChatList from './components/ChatList';
import SettingsPanel from './components/SettingsPanel';
import { 
    getLiveChatId, 
    getChatMessages, 
    deleteMessage, 
    banUser, 
    extractVideoId,
    initializeBots,
    initializeBotsFromFirebase,
    getBotSource,
    checkModeratorStatus,
    updateModStatusCache,
    ModeratorStatus
} from './services/botService';
import { 
    getLatestBroadcast, 
    checkFirebaseConnection,
    getGlobalBlacklist,
    getJudolPatterns
} from './services/firebaseService';
import { detectJudol } from './services/spamDetection';
import { ChatMessage, DashboardStats, FilterType, AppSettings } from './types';
import { Play, Square, Wifi, WifiOff, Settings, Volume2, VolumeX, Bot, Shield, ShieldCheck, ShieldAlert, Crown } from 'lucide-react';

// Sound notification
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) { console.log('Sound error:', e); }
};

const App: React.FC = () => {
  // App State
  const [videoUrl, setVideoUrl] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveChatId, setLiveChatId] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [pollingInterval, setPollingInterval] = useState(3000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [botCount, setBotCount] = useState(0);
  const [botSource, setBotSource] = useState<'local' | 'firebase' | 'none'>('none');
  const [modStatus, setModStatus] = useState<ModeratorStatus | null>(null);
  const [modCheckLoading, setModCheckLoading] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    autoDelete: false,
    autoTimeout: false,
    autoBan: false,
    soundEnabled: true,
    spamThreshold: 50,
    whitelist: [],
    blacklist: [],
  });
  
  // Data State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalChat: 0,
    spamDetected: 0,
    actionsTaken: 0,
    quotaUsed: 0
  });
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);

  // Refs
  const intervalRef = useRef<number | null>(null);
  const lastSpamCountRef = useRef(0);

  // Initialize app on mount
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      
      // Check Firebase connection
      const fbConnected = await checkFirebaseConnection();
      setFirebaseConnected(fbConnected);
      console.log(`[App] Firebase connected: ${fbConnected}`);
      
      // Load bots (try Firebase first, fallback to local)
      let bots;
      if (fbConnected) {
        bots = await initializeBotsFromFirebase();
        setBotSource(getBotSource());
        
        // Load broadcast message
        const broadcastMsg = await getLatestBroadcast();
        setBroadcast(broadcastMsg);
        
        // Load global blacklist for spam detection
        const blacklist = await getGlobalBlacklist();
        if (blacklist.length > 0) {
          console.log(`[App] Loaded ${blacklist.length} global blacklist entries`);
        }
        
        // Load cloud spam patterns
        const patterns = await getJudolPatterns();
        if (patterns.length > 0) {
          console.log(`[App] Loaded ${patterns.length} cloud spam patterns`);
        }
      } else {
        bots = initializeBots();
        setBotSource('local');
      }
      
      setBotCount(bots.length);
      setIsLoading(false);
    };
    
    initApp();
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('botDefendSettings');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch {}
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('botDefendSettings', JSON.stringify(settings));
  }, [settings]);

  // Monitoring Loop
  const pollMessages = useCallback(async () => {
    if (!liveChatId) return;

    try {
      const data = await getChatMessages(liveChatId, nextPageToken);
      setNextPageToken(data.nextPageToken);
      if (data.pollingIntervalMillis) {
        setPollingInterval(Math.max(data.pollingIntervalMillis, 1000));
      }

      const newMessages = data.messages;
      if (newMessages.length === 0) return;

      // Process Messages (Spam Detection)
      const processedMessages = newMessages.map(msg => {
        // Check whitelist
        if (settings.whitelist.some(w => msg.username.toLowerCase().includes(w.toLowerCase()))) {
          return { ...msg, isSpam: false, spamScore: 0, spamKeywords: [] };
        }
        // Check blacklist
        if (settings.blacklist.some(b => msg.username.toLowerCase().includes(b.toLowerCase()))) {
          return { ...msg, isSpam: true, spamScore: 100, spamKeywords: ['blacklisted'] };
        }
        const spamCheck = detectJudol(msg.message);
        return {
          ...msg,
          isSpam: spamCheck.score >= settings.spamThreshold,
          spamScore: spamCheck.score,
          spamKeywords: spamCheck.keywords
        };
      });

      // Auto-actions for spam (only if bot is moderator)
      const spamMessages = processedMessages.filter(m => m.isSpam);
      const canDoActions = modStatus?.isModerator !== false; // Allow if mod or unknown
      
      for (const spam of spamMessages) {
        if (canDoActions) {
          if (settings.autoDelete && !spam.deleted) {
            deleteMessage(spam.id)
              .then(() => {
                // Confirm mod status on success
                if (liveChatId && modStatus && !modStatus.isModerator) {
                  updateModStatusCache(liveChatId, true);
                  setModStatus(prev => prev ? { ...prev, isModerator: true, error: undefined } : prev);
                }
              })
              .catch((err) => {
                console.error('Auto-delete failed:', err);
                // Update mod status if 403
                if (err.message?.includes('bukan moderator') && liveChatId) {
                  updateModStatusCache(liveChatId, false);
                  setModStatus(prev => prev ? { ...prev, isModerator: false, error: 'Bot bukan moderator' } : prev);
                }
              });
            spam.deleted = true;
          }
          if (settings.autoTimeout && liveChatId) {
            banUser(liveChatId, spam.userId, false).catch(console.error);
          }
          if (settings.autoBan && liveChatId) {
            banUser(liveChatId, spam.userId, true).catch(console.error);
          }
        }
      }

      // Sound notification
      const newSpamCount = spamMessages.length;
      if (settings.soundEnabled && newSpamCount > 0 && stats.spamDetected !== lastSpamCountRef.current) {
        playNotificationSound();
      }
      lastSpamCountRef.current = stats.spamDetected + newSpamCount;

      // Update State
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = processedMessages.filter(m => !existingIds.has(m.id));
        const updated = [...prev, ...uniqueNew];
        if (updated.length > 500) return updated.slice(updated.length - 500);
        return updated;
      });

      // Update Stats (quotaUsed = jumlah API calls, bukan quota sebenarnya)
      const actionsCount = settings.autoDelete ? spamMessages.filter(m => m.deleted).length : 0;
      setStats(prev => ({
        ...prev,
        totalChat: prev.totalChat + newMessages.length,
        spamDetected: prev.spamDetected + newSpamCount,
        actionsTaken: prev.actionsTaken + actionsCount,
        quotaUsed: prev.quotaUsed + 1 + actionsCount // 1 untuk list, +1 per action
      }));

    } catch (err: any) {
      console.error("Polling error", err);
      setErrorMsg(err.message || "Error polling messages");
      stopMonitoring();
    }
  }, [liveChatId, nextPageToken, settings, stats.spamDetected]);

  // Polling interval effect
  useEffect(() => {
    if (isMonitoring && liveChatId) {
      intervalRef.current = window.setInterval(pollMessages, pollingInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMonitoring, liveChatId, pollingInterval, pollMessages]);

  const startMonitoring = async () => {
    setErrorMsg(null);
    setModStatus(null);
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setErrorMsg("Invalid YouTube URL");
      return;
    }
    try {
      const chatId = await getLiveChatId(videoId);
      setLiveChatId(chatId);
      
      // Check moderator status
      setModCheckLoading(true);
      const status = await checkModeratorStatus(chatId);
      setModStatus(status);
      setModCheckLoading(false);
      
      // Warn if auto-actions enabled but not confirmed as moderator
      if ((settings.autoDelete || settings.autoBan || settings.autoTimeout) && !status.isModerator) {
        setErrorMsg("⚠️ Bot mungkin bukan moderator - auto-actions mungkin gagal");
      }
      
      setIsMonitoring(true);
      setMessages([]);
      setStats({ totalChat: 0, spamDetected: 0, actionsTaken: 0, quotaUsed: 0 });
    } catch (err: any) {
      setModCheckLoading(false);
      setErrorMsg(err.message);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setModStatus(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleAction = async (action: 'delete' | 'ban' | 'timeout', idOrUserId: string) => {
    try {
      if (action === 'delete') {
        await deleteMessage(idOrUserId);
        setMessages(prev => prev.map(m => m.id === idOrUserId ? { ...m, deleted: true } : m));
        // Action succeeded - confirm bot is moderator
        if (liveChatId && modStatus && !modStatus.isModerator) {
          updateModStatusCache(liveChatId, true);
          setModStatus(prev => prev ? { ...prev, isModerator: true, error: undefined } : prev);
        }
      } else if (action === 'ban' && liveChatId) {
        await banUser(liveChatId, idOrUserId, true);
      } else if (action === 'timeout' && liveChatId) {
        await banUser(liveChatId, idOrUserId, false);
      }
      setStats(prev => ({
        ...prev,
        actionsTaken: prev.actionsTaken + 1,
        quotaUsed: prev.quotaUsed + 1
      }));
    } catch (err: any) {
      // Check if 403 error (not moderator)
      if (err.message?.includes('bukan moderator') || err.message?.includes('403')) {
        if (liveChatId) {
          updateModStatusCache(liveChatId, false);
          setModStatus(prev => prev ? { ...prev, isModerator: false, error: 'Bot bukan moderator di channel ini' } : prev);
        }
      }
      alert(`Action failed: ${err.message}`);
    }
  };

  const exportLog = () => {
    const spamLogs = messages.filter(m => m.isSpam).map(m => ({
      time: new Date(m.timestamp).toLocaleString(),
      user: m.username,
      message: m.message,
      score: m.spamScore,
      keywords: m.spamKeywords?.join(', ')
    }));
    const blob = new Blob([JSON.stringify(spamLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spam-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 font-sans">
      {/* Navbar */}
      <nav className="bg-[#1a1a1a] border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-900/20 p-2 rounded-lg border border-emerald-900/50">
              <Shield className="text-emerald-500" size={24} />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">YouTube Bot Defend</span>
            {settings.autoDelete && (
              <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-900">
                AUTO-DELETE ON
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Moderator Status */}
            {modCheckLoading && (
              <div className="flex items-center gap-2 bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-900/50">
                <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
                <span className="text-sm text-yellow-300">Checking mod...</span>
              </div>
            )}
            {modStatus && !modCheckLoading && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                modStatus.isOwner 
                  ? 'bg-purple-900/20 border-purple-900/50' 
                  : modStatus.isModerator 
                    ? 'bg-emerald-900/20 border-emerald-900/50' 
                    : 'bg-red-900/20 border-red-900/50'
              }`}>
                {modStatus.isOwner ? (
                  <Crown size={16} className="text-purple-400" />
                ) : modStatus.isModerator ? (
                  <ShieldCheck size={16} className="text-emerald-400" />
                ) : (
                  <ShieldAlert size={16} className="text-red-400" />
                )}
                <span className={`text-sm ${
                  modStatus.isOwner 
                    ? 'text-purple-300' 
                    : modStatus.isModerator 
                      ? 'text-emerald-300' 
                      : 'text-red-300'
                }`}>
                  {modStatus.isOwner 
                    ? 'OWNER' 
                    : modStatus.isModerator 
                      ? 'MODERATOR' 
                      : 'NOT MOD'}
                </span>
              </div>
            )}
            
            {/* Bot Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              botSource === 'firebase' 
                ? 'bg-blue-900/20 border-blue-900/50' 
                : 'bg-emerald-900/20 border-emerald-900/50'
            }`}>
              <Bot size={16} className={botSource === 'firebase' ? 'text-blue-400' : 'text-emerald-400'} />
              <span className={`text-sm ${botSource === 'firebase' ? 'text-blue-300' : 'text-emerald-300'}`}>
                {botCount} Bot {botSource === 'firebase' ? '☁️' : '💾'}
              </span>
            </div>
            
            {/* Firebase Status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
              firebaseConnected 
                ? 'bg-green-900/20 text-green-400 border border-green-900/50' 
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-400' : 'bg-gray-500'}`} />
              {firebaseConnected ? 'Firebase' : 'Offline'}
            </div>
            
            <button
              onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
              className={`p-2 rounded ${settings.soundEnabled ? 'text-emerald-400' : 'text-gray-500'}`}
              title={settings.soundEnabled ? 'Sound ON' : 'Sound OFF'}
            >
              {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded text-gray-400 hover:text-white"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel 
          settings={settings} 
          setSettings={setSettings} 
          onClose={() => setShowSettings(false)}
          onExportLog={exportLog}
        />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6 flex items-center justify-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full" />
            <span className="text-gray-300">Connecting to Firebase...</span>
          </div>
        )}

        {/* Broadcast Banner */}
        {broadcast && !isLoading && (
          <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-xl p-3 mb-6">
            <p className="text-yellow-200 text-sm">{broadcast}</p>
          </div>
        )}

        {/* Warning Banner - Not Moderator */}
        {modStatus && !modStatus.isModerator && isMonitoring && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-red-500 mt-0.5" size={20} />
              <div>
                <p className="text-red-200 font-medium">⚠️ Bot Bukan Moderator!</p>
                <p className="text-sm text-red-300/80 mt-1">
                  Bot "{modStatus.botName}" tidak memiliki akses moderator di channel ini. 
                  Auto-delete dan ban tidak akan berfungsi. Minta owner channel untuk add bot sebagai moderator.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        {!isMonitoring && (
          <div className="bg-blue-900/20 border border-blue-900/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-500 mt-0.5" size={20} />
              <div>
                <p className="text-blue-200 font-medium">Cara Penggunaan:</p>
                <ol className="text-sm text-blue-300/80 mt-1 list-decimal list-inside space-y-1">
                  <li>Pastikan bot sudah di-add sebagai <strong>moderator</strong> di channel target</li>
                  <li>Paste link live streaming YouTube di bawah</li>
                  <li>Klik Start Monitoring - spam akan terdeteksi otomatis</li>
                  <li>Aktifkan Auto-Delete di Settings untuk hapus spam otomatis</li>
                </ol>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Banner - Moderator Confirmed */}
        {modStatus && modStatus.isModerator && isMonitoring && (
          <div className={`${modStatus.isOwner ? 'bg-purple-900/20 border-purple-900/50' : 'bg-emerald-900/20 border-emerald-900/50'} border rounded-xl p-4 mb-6`}>
            <div className="flex items-start gap-3">
              {modStatus.isOwner ? (
                <Crown className="text-purple-500 mt-0.5" size={20} />
              ) : (
                <ShieldCheck className="text-emerald-500 mt-0.5" size={20} />
              )}
              <div>
                <p className={`${modStatus.isOwner ? 'text-purple-200' : 'text-emerald-200'} font-medium`}>
                  {modStatus.isOwner ? '👑 Bot adalah OWNER channel' : '✅ Bot adalah Moderator'}
                </p>
                <p className={`text-sm ${modStatus.isOwner ? 'text-purple-300/80' : 'text-emerald-300/80'} mt-1`}>
                  {modStatus.botName} dapat melakukan delete chat dan ban user secara otomatis.
                  {modStatus.error && <span className="text-yellow-400 ml-2">({modStatus.error})</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">YouTube Live URL</label>
              <input 
                type="text" 
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... atau https://youtube.com/live/..."
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                disabled={isMonitoring}
              />
            </div>
            <button 
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              disabled={botCount === 0}
              className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                botCount === 0 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : isMonitoring 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isMonitoring ? (
                <><Square size={18} fill="currentColor" /> Stop</>
              ) : (
                <><Play size={18} fill="currentColor" /> Start Monitoring</>
              )}
            </button>
          </div>
          
          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 ${isMonitoring ? 'text-emerald-400' : 'text-gray-500'}`}>
                {isMonitoring ? <Wifi size={16} /> : <WifiOff size={16} />}
                {isMonitoring ? 'MONITORING ACTIVE' : 'OFFLINE'}
              </span>
              {isMonitoring && <span className="text-gray-600">| Poll: {pollingInterval}ms</span>}
            </div>
            {errorMsg && (
              <span className="text-red-400 font-medium bg-red-900/10 px-2 py-1 rounded border border-red-900/30">
                {errorMsg}
              </span>
            )}
          </div>
        </div>

        <StatsCards stats={stats} isMonitoring={isMonitoring} />

        <ChatList 
          messages={messages} 
          filter={filter}
          setFilter={setFilter}
          onDelete={(id) => handleAction('delete', id)}
          onTimeout={(userId) => handleAction('timeout', userId)}
          onBan={(userId) => handleAction('ban', userId)}
        />
      </main>
    </div>
  );
};

export default App;
