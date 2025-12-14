/**
 * YouTube Bot Defend - Web App v2.0
 * Modern layout dengan sidebar navigation dan custom themes
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';

// Pages
import DashboardPage from './pages/DashboardPage';
import MonitoringPage from './pages/MonitoringPage';
import LogsPage from './pages/LogsPage';
import DetectionPage from './pages/DetectionPage';
import BotsPage from './pages/BotsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ThemesPage from './pages/ThemesPage';

// Services
import { 
  getLiveChatId, 
  getChatMessages, 
  deleteMessage, 
  banUser, 
  extractVideoId,
  initializeBotsFromFirebase,
  getBotSource,
  checkModeratorStatus,
  updateModStatusCache,
  ModeratorStatus
} from './services/botService';
import { 
  checkFirebaseConnection,
  getGlobalBlacklist,
  getJudolPatterns,
  trackSessionStart,
  trackApiCall,
  trackSpamDetected,
  trackMessageDeleted,
  trackUserActivity,
} from './services/firebaseService';
import { 
  recordSpamDetection, 
  recordMessageScan, 
  recordAction,
  getSpamType 
} from './services/analyticsService';
import { detectJudol } from './services/spamDetection';
import { detectSpamWithAI, isAIDetectionAvailable } from './services/aiDetection';
import { ChatMessage, DashboardStats, FilterType, AppSettings, ModerationEntry } from './types';

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

const AppContent: React.FC = () => {
  // App State
  const [videoUrl, setVideoUrl] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveChatId, setLiveChatId] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [pollingInterval, setPollingInterval] = useState(3000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [botCount, setBotCount] = useState(0);
  const [botSource, setBotSource] = useState<'local' | 'firebase' | 'none'>('none');
  const [modStatus, setModStatus] = useState<ModeratorStatus | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
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
    aiDetectionEnabled: false,
    customSpamWords: [],
  });
  
  // Data State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [moderationLog, setModerationLog] = useState<ModerationEntry[]>([]);
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

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      const fbConnected = await checkFirebaseConnection();
      setFirebaseConnected(fbConnected);
      
      if (fbConnected) {
        const bots = await initializeBotsFromFirebase();
        setBotSource(getBotSource());
        setBotCount(bots.length);
        await getGlobalBlacklist();
        await getJudolPatterns();
      }
      
      setIsLoading(false);
    };
    
    initApp();
    
    // Load settings
    const savedSettings = localStorage.getItem('botDefendSettings');
    if (savedSettings) {
      try { 
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          whitelist: parsed.whitelist || [],
          blacklist: parsed.blacklist || [],
          customSpamWords: parsed.customSpamWords || [],
        })); 
      } catch {}
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('botDefendSettings', JSON.stringify(settings));
  }, [settings]);

  // Polling logic
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

      // Process messages
      const processedMessages = newMessages.map(msg => {
        const whitelist = (settings.whitelist || []).filter(w => w && typeof w === 'string');
        const blacklist = (settings.blacklist || []).filter(b => b && typeof b === 'string');
        const username = msg.username || '';
        const message = msg.message || '';
        
        if (whitelist.length > 0 && whitelist.some(w => username.toLowerCase().includes(w.toLowerCase()))) {
          return { ...msg, isSpam: false, spamScore: 0, spamKeywords: [] };
        }
        if (blacklist.length > 0 && blacklist.some(b => username.toLowerCase().includes(b.toLowerCase()))) {
          return { ...msg, isSpam: true, spamScore: 100, spamKeywords: ['blacklisted'] };
        }
        const spamCheck = detectJudol(message, (settings.customSpamWords || []).filter(w => w && typeof w === 'string'));
        return {
          ...msg,
          isSpam: spamCheck.score >= settings.spamThreshold,
          spamScore: spamCheck.score,
          spamKeywords: spamCheck.keywords
        };
      });

      // AI Detection
      if (settings.aiDetectionEnabled && isAIDetectionAvailable()) {
        const nonSpamMessages = processedMessages.filter(m => !m.isSpam);
        const toCheck = nonSpamMessages.slice(0, 3);
        
        for (const msg of toCheck) {
          try {
            const aiResult = await detectSpamWithAI(msg.message);
            if (aiResult.isSpam && aiResult.confidence >= 70) {
              const idx = processedMessages.findIndex(m => m.id === msg.id);
              if (idx !== -1) {
                processedMessages[idx].isSpam = true;
                processedMessages[idx].spamScore = aiResult.confidence;
                processedMessages[idx].spamKeywords = [`AI:${aiResult.reason}`];
              }
            }
          } catch (e) {
            console.error('[AI Detection] Error:', e);
          }
        }
      }

      // Auto-actions
      const spamMessages = processedMessages.filter(m => m.isSpam);
      const canDoActions = modStatus?.isModerator !== false;
      
      for (const spam of spamMessages) {
        const logEntry: ModerationEntry = {
          id: spam.id,
          type: 'spam_detected',
          username: spam.username,
          userId: spam.userId,
          userPhoto: spam.userPhoto,
          message: spam.message,
          spamScore: spam.spamScore,
          spamKeywords: spam.spamKeywords,
          timestamp: new Date().toISOString(),
          actionTaken: false,
        };
        
        if (canDoActions) {
          if (settings.autoDelete && !spam.deleted) {
            deleteMessage(spam.id)
              .then(() => {
                if (liveChatId && modStatus && !modStatus.isModerator) {
                  updateModStatusCache(liveChatId, true);
                  setModStatus(prev => prev ? { ...prev, isModerator: true } : prev);
                }
                setModerationLog(prev => prev.map(entry => 
                  entry.id === spam.id ? { ...entry, type: 'deleted', actionTaken: true } : entry
                ));
              })
              .catch((err) => {
                if (err.message?.includes('bukan moderator') && liveChatId) {
                  updateModStatusCache(liveChatId, false);
                  setModStatus(prev => prev ? { ...prev, isModerator: false } : prev);
                }
              });
            spam.deleted = true;
            logEntry.type = 'deleted';
            logEntry.actionTaken = true;
          }
          if (settings.autoTimeout && liveChatId) {
            banUser(liveChatId, spam.userId, false).catch(console.error);
            logEntry.type = 'timeout';
            logEntry.actionTaken = true;
          }
          if (settings.autoBan && liveChatId) {
            banUser(liveChatId, spam.userId, true).catch(console.error);
            logEntry.type = 'banned';
            logEntry.actionTaken = true;
          }
        }
        
        setModerationLog(prev => {
          const exists = prev.some(e => e.id === logEntry.id);
          if (exists) return prev;
          const updated = [logEntry, ...prev];
          return updated.slice(0, 200);
        });
      }

      // Sound notification
      if (settings.soundEnabled && spamMessages.length > 0 && stats.spamDetected !== lastSpamCountRef.current) {
        playNotificationSound();
      }
      lastSpamCountRef.current = stats.spamDetected + spamMessages.length;

      // Update messages
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = processedMessages.filter(m => !existingIds.has(m.id));
        const updated = [...prev, ...uniqueNew];
        return updated.slice(-500);
      });

      // Update stats
      const actionsCount = settings.autoDelete ? spamMessages.filter(m => m.deleted).length : 0;
      setStats(prev => ({
        ...prev,
        totalChat: prev.totalChat + newMessages.length,
        spamDetected: prev.spamDetected + spamMessages.length,
        actionsTaken: prev.actionsTaken + actionsCount,
        quotaUsed: prev.quotaUsed + 1 + actionsCount
      }));

      trackApiCall(1 + actionsCount);
      if (spamMessages.length > 0) trackSpamDetected(spamMessages.length);
      if (actionsCount > 0) trackMessageDeleted(actionsCount);

      // Record to analytics
      recordMessageScan(newMessages.length);
      for (const spam of spamMessages) {
        const spamType = getSpamType(spam.spamKeywords || []);
        recordSpamDetection(spamType, spam.deleted || false);
      }

    } catch (err: any) {
      console.error("Polling error", err);
      setErrorMsg(err.message || "Gagal mengambil pesan");
      stopMonitoring();
    }
  }, [liveChatId, nextPageToken, settings, stats.spamDetected, modStatus]);

  // Polling interval
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
      setErrorMsg("URL YouTube tidak valid");
      return;
    }
    try {
      const chatId = await getLiveChatId(videoId);
      setLiveChatId(chatId);
      
      const status = await checkModeratorStatus(chatId);
      setModStatus(status);
      
      setIsMonitoring(true);
      setMessages([]);
      setModerationLog([]);
      setStats({ totalChat: 0, spamDetected: 0, actionsTaken: 0, quotaUsed: 0 });
      trackSessionStart();
      
      // Track user activity for admin dashboard
      if (status?.channelId) {
        trackUserActivity(status.channelId, status.botName || '');
      }
    } catch (err: any) {
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

  const handleAction = async (action: 'delete' | 'ban' | 'timeout', idOrUserId: string, entry?: ModerationEntry) => {
    try {
      if (action === 'delete') {
        await deleteMessage(idOrUserId);
        setModerationLog(prev => prev.map(e => 
          e.id === idOrUserId ? { ...e, type: 'deleted', actionTaken: true } : e
        ));
      } else if (action === 'ban' && liveChatId) {
        await banUser(liveChatId, idOrUserId, true);
        if (entry) {
          setModerationLog(prev => prev.map(e => 
            e.userId === idOrUserId ? { ...e, type: 'banned', actionTaken: true } : e
          ));
        }
      } else if (action === 'timeout' && liveChatId) {
        await banUser(liveChatId, idOrUserId, false);
        if (entry) {
          setModerationLog(prev => prev.map(e => 
            e.userId === idOrUserId ? { ...e, type: 'timeout', actionTaken: true } : e
          ));
        }
      }
      setStats(prev => ({ ...prev, actionsTaken: prev.actionsTaken + 1, quotaUsed: prev.quotaUsed + 1 }));
      trackApiCall(1);
      recordAction();
    } catch (err: any) {
      alert(`Aksi gagal: ${err.message}`);
    }
  };

  const exportLog = () => {
    const exportData = moderationLog.map(entry => ({
      time: new Date(entry.timestamp).toLocaleString(),
      type: entry.type,
      user: entry.username,
      message: entry.message,
      score: entry.spamScore,
      keywords: entry.spamKeywords?.join(', '),
      actionTaken: entry.actionTaken
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moderation-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout botCount={botCount} botSource={botSource} firebaseConnected={firebaseConnected} isMonitoring={isMonitoring} />}>
        <Route path="/" element={
          <DashboardPage 
            stats={stats}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            onStartMonitoring={isMonitoring ? stopMonitoring : startMonitoring}
            isMonitoring={isMonitoring}
            botCount={botCount}
          />
        } />
        <Route path="/monitoring" element={
          <MonitoringPage
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            isMonitoring={isMonitoring}
            onStartMonitoring={startMonitoring}
            onStopMonitoring={stopMonitoring}
            moderationLog={moderationLog}
            filter={filter}
            setFilter={setFilter}
            onDelete={(id, entry) => handleAction('delete', id, entry)}
            onTimeout={(userId, entry) => handleAction('timeout', userId, entry)}
            onBan={(userId, entry) => handleAction('ban', userId, entry)}
            stats={stats}
            modStatus={modStatus}
            pollingInterval={pollingInterval}
            botCount={botCount}
          />
        } />
        <Route path="/logs" element={
          <LogsPage
            moderationLog={moderationLog}
            filter={filter}
            setFilter={setFilter}
            onDelete={(id, entry) => handleAction('delete', id, entry)}
            onTimeout={(userId, entry) => handleAction('timeout', userId, entry)}
            onBan={(userId, entry) => handleAction('ban', userId, entry)}
            onExportLog={exportLog}
          />
        } />
        <Route path="/detection" element={
          <DetectionPage settings={settings} setSettings={setSettings} />
        } />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={
          <SettingsPage settings={settings} setSettings={setSettings} onExportLog={exportLog} />
        } />
        <Route path="/themes" element={<ThemesPage />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
