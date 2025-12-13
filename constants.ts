// Google OAuth Config - dari environment variable atau hardcode untuk development
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
function parseApiKeys(): string[] {
  const envKeys = import.meta.env.VITE_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map((k: string) => k.trim()).filter(Boolean);
  }
  return [];
}

export const API_KEYS = parseApiKeys();

export const APP_COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  accent: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};
