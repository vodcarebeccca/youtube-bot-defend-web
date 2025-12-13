/**
 * Bot Service - Menggunakan pre-authorized bot tokens
 * Bot harus sudah jadi moderator di channel target
 * Supports loading from Firebase cloud or local constants
 */

import { BOT_TOKENS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, API_KEYS } from '../constants';
import { ChatMessage } from '../types';
import { getCloudBots, parseTokenData } from './firebaseService';

// API Key rotation for fallback
let currentApiKeyIndex = 0;
function getApiKey(): string {
  const key = API_KEYS[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
  return key;
}

interface BotToken {
  id: number;
  name: string;
  accessToken: string;
  refreshToken: string;
  channelId: string;
  expiresAt?: number;
  source: 'local' | 'firebase'; // Track where bot came from
}

// Current active bot
let currentBotIndex = 0;
let activeBots: BotToken[] = [];
let botsInitialized = false;

// Initialize bots from local constants (fallback)
export function initializeBots(): BotToken[] {
  activeBots = BOT_TOKENS.map((token, index) => ({
    id: index + 1,
    name: token.name || `Bot ${index + 1}`,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    channelId: token.channel_id || '',
    expiresAt: 0, // Force refresh on first use
    source: 'local' as const,
  }));
  botsInitialized = true;
  console.log(`[BotService] Initialized ${activeBots.length} bots from local`);
  return activeBots;
}

/**
 * Initialize bots from Firebase cloud
 * Falls back to local constants if Firebase fails
 * Supports both old format (token_data JSON string) and new format (direct access_token/refresh_token)
 */
export async function initializeBotsFromFirebase(): Promise<BotToken[]> {
  console.log('[BotService] Loading bots from Firebase...');
  
  try {
    const cloudBots = await getCloudBots();
    console.log('[BotService] Cloud bots raw:', cloudBots);
    
    if (cloudBots.length > 0) {
      const firebaseBots: BotToken[] = [];
      
      for (const cloudBot of cloudBots) {
        let accessToken = '';
        let refreshToken = '';
        let channelId = cloudBot.channel_id || '';
        
        // Format 1: Old format with token_data JSON string
        if (cloudBot.has_token && cloudBot.token_data) {
          const tokenData = parseTokenData(cloudBot.token_data);
          if (tokenData && tokenData.refresh_token) {
            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token;
            channelId = tokenData.channel_id || channelId;
          }
        }
        
        // Format 2: New format with direct access_token/refresh_token fields
        // Check if bot has direct token fields (from admin panel web)
        const botAny = cloudBot as any;
        if (!refreshToken && botAny.access_token && botAny.refresh_token) {
          accessToken = botAny.access_token;
          refreshToken = botAny.refresh_token;
          console.log(`[BotService] Found direct token format for ${cloudBot.name}`);
        }
        
        // Add bot if we have valid refresh token
        if (refreshToken) {
          firebaseBots.push({
            id: parseInt(cloudBot.id) || firebaseBots.length + 1,
            name: cloudBot.name || `Bot ${cloudBot.id}`,
            accessToken: accessToken,
            refreshToken: refreshToken,
            channelId: channelId,
            expiresAt: 0, // Force refresh
            source: 'firebase',
          });
          console.log(`[BotService] ✅ Added bot: ${cloudBot.name}`);
        } else {
          console.log(`[BotService] ⚠️ Skipped bot ${cloudBot.name} - no valid token`);
        }
      }
      
      if (firebaseBots.length > 0) {
        activeBots = firebaseBots;
        botsInitialized = true;
        console.log(`[BotService] ✅ Loaded ${firebaseBots.length} bots from Firebase`);
        return activeBots;
      }
    }
    
    // Fallback to local if no Firebase bots
    console.log('[BotService] No Firebase bots found, using local fallback');
    return initializeBots();
    
  } catch (e) {
    console.error('[BotService] Firebase load failed, using local fallback:', e);
    return initializeBots();
  }
}

/**
 * Get bot source info
 */
export function getBotSource(): 'local' | 'firebase' | 'none' {
  if (activeBots.length === 0) return 'none';
  return activeBots[0].source;
}

// Get next available bot (rotation)
function getNextBot(): BotToken | null {
  if (activeBots.length === 0) {
    initializeBots();
  }
  if (activeBots.length === 0) return null;
  
  const bot = activeBots[currentBotIndex];
  currentBotIndex = (currentBotIndex + 1) % activeBots.length;
  return bot;
}

// Refresh token if needed
async function refreshTokenIfNeeded(bot: BotToken): Promise<string> {
  // Check if token is expired (with 5 min buffer) or expiresAt is 0 (force refresh)
  if (!bot.expiresAt || Date.now() > bot.expiresAt - 300000) {
    console.log(`[BotService] Refreshing token for ${bot.name}...`);
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: bot.refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        bot.accessToken = data.access_token;
        bot.expiresAt = Date.now() + (data.expires_in * 1000);
        console.log(`[BotService] ✅ Token refreshed for ${bot.name}`);
      } else {
        const errorData = await response.json();
        console.error(`[BotService] ❌ Token refresh failed for ${bot.name}:`, errorData);
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
      }
    } catch (e) {
      console.error('[BotService] Token refresh error:', e);
      throw e;
    }
  }
  return bot.accessToken;
}

// Extract video ID from URL
export function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get Live Chat ID from video
export async function getLiveChatId(videoId: string): Promise<string> {
  console.log(`[BotService] Getting live chat ID for video: ${videoId}`);
  
  // Try with bot token first
  const bot = getNextBot();
  let token = '';
  let useApiKey = false;
  
  if (bot) {
    try {
      token = await refreshTokenIfNeeded(bot);
    } catch (e) {
      console.warn('[BotService] Token refresh failed, using API key fallback');
      useApiKey = true;
    }
  } else {
    useApiKey = true;
  }
  
  // Build request
  let url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}`;
  const headers: Record<string, string> = {};
  
  if (useApiKey) {
    url += `&key=${getApiKey()}`;
  } else {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[BotService] API Error:', errorData);
    throw new Error(errorData.error?.message || 'Failed to fetch video details');
  }
  
  const data = await response.json();
  console.log('[BotService] Video data:', data);
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Video tidak ditemukan. Pastikan URL benar.');
  }
  
  if (!data.items[0]?.liveStreamingDetails?.activeLiveChatId) {
    throw new Error('Live chat tidak aktif. Pastikan video sedang LIVE.');
  }
  
  return data.items[0].liveStreamingDetails.activeLiveChatId;
}

// Get chat messages
export async function getChatMessages(liveChatId: string, pageToken?: string) {
  const bot = getNextBot();
  if (!bot) throw new Error('No bot available');
  
  const token = await refreshTokenIfNeeded(bot);
  let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&maxResults=200`;
  if (pageToken) url += `&pageToken=${pageToken}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch chat messages');
  const data = await response.json();
  
  const messages: ChatMessage[] = data.items?.map((item: any) => ({
    id: item.id,
    oderId: item.authorDetails.channelId,
    username: item.authorDetails.displayName,
    userPhoto: item.authorDetails.profileImageUrl,
    message: item.snippet.displayMessage,
    timestamp: item.snippet.publishedAt,
    isModerator: item.authorDetails.isChatModerator,
    isOwner: item.authorDetails.isChatOwner,
  })) || [];

  return {
    messages,
    nextPageToken: data.nextPageToken,
    pollingIntervalMillis: data.pollingIntervalMillis || 3000,
  };
}

// Delete message (bot must be moderator)
export async function deleteMessage(messageId: string): Promise<boolean> {
  const bot = getNextBot();
  if (!bot) throw new Error('No bot available');
  
  const token = await refreshTokenIfNeeded(bot);
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/liveChat/messages?id=${messageId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  if (response.status === 204) {
    console.log(`[BotService] Message deleted by ${bot.name}`);
    return true;
  }
  if (response.status === 403) {
    console.error(`[BotService] ${bot.name} is not moderator!`);
    throw new Error(`Bot "${bot.name}" bukan moderator di channel ini`);
  }
  return false;
}

// Ban user (bot must be moderator)
export async function banUser(liveChatId: string, userId: string, permanent: boolean = true): Promise<boolean> {
  const bot = getNextBot();
  if (!bot) throw new Error('No bot available');
  
  const token = await refreshTokenIfNeeded(bot);
  const body = {
    snippet: {
      liveChatId,
      bannedUserDetails: { channelId: userId },
      type: permanent ? 'permanent' : 'temporary',
      ...(permanent ? {} : { banDurationSeconds: 300 })
    }
  };
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/liveChat/bans?part=snippet`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  
  if (response.ok) {
    console.log(`[BotService] User ${permanent ? 'banned' : 'timed out'} by ${bot.name}`);
    return true;
  }
  if (response.status === 403) {
    throw new Error(`Bot "${bot.name}" bukan moderator di channel ini`);
  }
  return false;
}

// Get list of available bots
export function getAvailableBots(): { id: number; name: string; channelId: string }[] {
  if (activeBots.length === 0) initializeBots();
  return activeBots.map(b => ({ id: b.id, name: b.name, channelId: b.channelId }));
}

// Moderator status cache per liveChatId
const modStatusCache: Map<string, { isMod: boolean; checkedAt: number }> = new Map();

export interface ModeratorStatus {
  isModerator: boolean;
  isOwner: boolean;
  botName: string;
  channelId: string;
  error?: string;
}

/**
 * Check if bot is moderator on the live chat
 * YouTube API tidak punya cara langsung untuk check mod status untuk non-owner
 * Solusi:
 * 1. Try list moderators (hanya works untuk OWNER)
 * 2. Jika gagal, try test delete action (akan gagal 403 jika bukan mod)
 * 3. Cache hasil untuk menghindari spam API
 */
export async function checkModeratorStatus(liveChatId: string): Promise<ModeratorStatus> {
  const bot = getNextBot();
  if (!bot) {
    return { isModerator: false, isOwner: false, botName: 'Unknown', channelId: '', error: 'No bot available' };
  }

  // Check cache (valid for 5 minutes)
  const cached = modStatusCache.get(liveChatId);
  if (cached && Date.now() - cached.checkedAt < 300000) {
    console.log(`[BotService] Using cached mod status for ${bot.name}: ${cached.isMod}`);
    return { 
      isModerator: cached.isMod, 
      isOwner: false, 
      botName: bot.name, 
      channelId: bot.channelId 
    };
  }

  try {
    const token = await refreshTokenIfNeeded(bot);
    
    // Method 1: Try to list moderators (only works for OWNER)
    const modListUrl = `https://www.googleapis.com/youtube/v3/liveChat/moderators?part=snippet&liveChatId=${liveChatId}&maxResults=50`;
    const modListResponse = await fetch(modListUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (modListResponse.ok) {
      // If we can list moderators, we are OWNER (has full access)
      console.log(`[BotService] ${bot.name}: ✅ OWNER - can moderate`);
      modStatusCache.set(liveChatId, { isMod: true, checkedAt: Date.now() });
      return { isModerator: true, isOwner: true, botName: bot.name, channelId: bot.channelId };
    }

    // Method 2: If not owner, we can't directly check mod status
    // YouTube API returns 403 for non-owners trying to list moderators
    // We'll assume bot is moderator and verify on first action
    if (modListResponse.status === 403) {
      console.log(`[BotService] ${bot.name}: ⚠️ Not owner, assuming moderator (will verify on action)`);
      // Don't cache this - let it be verified on first action
      return { 
        isModerator: true, // Assume mod until proven otherwise
        isOwner: false, 
        botName: bot.name, 
        channelId: bot.channelId,
        error: 'Cannot verify mod status - will confirm on first action'
      };
    }

    // Other error
    const errorData = await modListResponse.json().catch(() => ({}));
    console.error(`[BotService] Mod check error:`, errorData);
    return { 
      isModerator: false, 
      isOwner: false, 
      botName: bot.name, 
      channelId: bot.channelId,
      error: errorData.error?.message || 'Failed to check moderator status'
    };

  } catch (e: any) {
    console.error('[BotService] Mod check exception:', e);
    return { 
      isModerator: false, 
      isOwner: false, 
      botName: bot.name, 
      channelId: bot.channelId,
      error: e.message 
    };
  }
}

/**
 * Update mod status cache when action fails with 403
 * Call this when delete/ban fails to update the cache
 */
export function updateModStatusCache(liveChatId: string, isMod: boolean): void {
  modStatusCache.set(liveChatId, { isMod, checkedAt: Date.now() });
  console.log(`[BotService] Updated mod status cache: ${isMod}`);
}

/**
 * Clear mod status cache for a specific liveChatId
 */
export function clearModStatusCache(liveChatId?: string): void {
  if (liveChatId) {
    modStatusCache.delete(liveChatId);
  } else {
    modStatusCache.clear();
  }
}
