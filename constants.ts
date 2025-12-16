// Google OAuth Config - dari environment variable
// Set these in Vercel Environment Variables:
// VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "";

// Bot Tokens - bisa dari environment variable (JSON string) atau kosong
// Format: [{"name":"Bot1","access_token":"...","refresh_token":"...","channel_id":"..."}]
function parseBotTokens(): Array<{
  name: string;
  access_token: string;
  refresh_token: string;
  channel_id: string;
}> {
  const envTokens = import.meta.env.VITE_BOT_TOKENS;
  if (envTokens) {
    try {
      return JSON.parse(envTokens);
    } catch (e) {
      console.error('[Constants] Failed to parse VITE_BOT_TOKENS:', e);
    }
  }
  return [];
}

export const BOT_TOKENS = parseBotTokens();

// YouTube API Keys - dari environment variable (comma-separated) atau kosong
// Supports multiple projects for quota pooling (10,000 quota per project per day)
function parseApiKeys(): string[] {
  const envKeys = import.meta.env.VITE_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map((k: string) => k.trim()).filter(Boolean);
  }
  return [];
}

export const API_KEYS = parseApiKeys();

// Quota per project per day (YouTube Data API v3)
export const QUOTA_PER_PROJECT = 10000;

// Quota costs for different operations
export const QUOTA_COSTS = {
  videos_list: 1,        // Get video details (liveChatId)
  liveChat_messages: 5,  // List chat messages (polling)
  liveChat_delete: 50,   // Delete message
  liveChat_ban: 50,      // Ban user
  liveChat_moderators: 50, // List moderators
};

export const APP_COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  accent: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};
