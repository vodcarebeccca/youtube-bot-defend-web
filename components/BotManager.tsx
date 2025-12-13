/**
 * Bot Manager Component - Menampilkan daftar bot yang tersedia
 * User bisa lihat nama bot dan link channel untuk add sebagai moderator
 */
import React, { useState, useEffect } from 'react';
import { Bot, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Shield } from 'lucide-react';

// Firebase Config
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDtDlYCdA07dTwU3paVJHo21PMt-cCU55I',
  projectId: 'yt-bot-defend',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

interface BotInfo {
  _id?: string;
  name: string;
  channel_url?: string;
  avatar_url?: string;
  enabled: boolean;
}

// Helper to parse Firestore document
function firestoreToDict(doc: any): Record<string, any> {
  const fields = doc.fields || {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields) as [string, any][]) {
    if ('stringValue' in value) result[key] = value.stringValue;
    else if ('booleanValue' in value) result[key] = value.booleanValue;
  }
  if (doc.name) result._id = doc.name.split('/').pop();
  return result;
}

interface BotManagerProps {
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

const BotManager: React.FC<BotManagerProps> = ({ 
  isCollapsible = true, 
  defaultExpanded = false 
}) => {
  const [bots, setBots] = useState<BotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);

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
        const botList = (data.documents || [])
          .map(firestoreToDict)
          .filter((b: BotInfo) => b.enabled !== false) as BotInfo[];
        setBots(botList);
      }
    } catch (e) {
      console.error('Load bots error:', e);
    }
    setLoading(false);
  };

  // If no bots with channel_url, don't show this section
  const botsWithUrl = bots.filter(b => b.channel_url);
  if (!loading && botsWithUrl.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 mb-6 overflow-hidden">
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-4 ${isCollapsible ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
        onClick={() => isCollapsible && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-900/50">
            <Bot className="text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Bot Manager</h3>
            <p className="text-xs text-gray-500">
              {botsWithUrl.length} bot tersedia - tambahkan sebagai moderator di channel kamu
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); loadBots(); }}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {isCollapsible && (
            <div className="text-gray-400">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {(expanded || !isCollapsible) && (
        <div className="border-t border-gray-800">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
              Memuat daftar bot...
            </div>
          ) : botsWithUrl.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Belum ada bot yang tersedia
            </div>
          ) : (
            <div className="p-4">
              {/* Instructions */}
              <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-300">
                  <Shield size={14} className="inline mr-1" />
                  Untuk menggunakan bot, kamu perlu menambahkan bot sebagai <strong>moderator</strong> di channel YouTube kamu:
                </p>
                <ol className="text-xs text-blue-300/80 mt-2 list-decimal list-inside space-y-1">
                  <li>Klik link channel bot di bawah</li>
                  <li>Di YouTube Studio → Settings → Community → Moderators</li>
                  <li>Tambahkan channel bot sebagai moderator</li>
                </ol>
              </div>

              {/* Bot List */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {botsWithUrl.map((bot) => (
                  <div
                    key={bot._id}
                    className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-blue-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {bot.avatar_url ? (
                        <img 
                          src={bot.avatar_url} 
                          alt="" 
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <Bot size={20} className="text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{bot.name || 'Bot'}</p>
                        {bot.channel_url && (
                          <a
                            href={bot.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                          >
                            <ExternalLink size={12} />
                            Buka Channel
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BotManager;
