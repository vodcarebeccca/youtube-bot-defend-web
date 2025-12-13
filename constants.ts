// Google OAuth Config - User harus setup sendiri di Google Cloud Console
// Lihat README.md untuk panduan setup
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "";

// Bot Tokens - User akan login dengan akun YouTube mereka sendiri
// Token akan disimpan di localStorage setelah OAuth login
export const BOT_TOKENS: Array<{
  name: string;
  access_token: string;
  refresh_token: string;
  channel_id: string;
}> = [];

// YouTube API Keys - User harus setup sendiri
// Bisa ditambahkan via environment variable atau settings
export const API_KEYS: string[] = [];

export const APP_COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  accent: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};
