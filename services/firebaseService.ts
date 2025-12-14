/**
 * Firebase Service for YouTube Bot Defend Web App
 * Sync dengan Firebase yang sama seperti Python tools
 * Menggunakan Firestore REST API (tanpa SDK untuk bundle size kecil)
 */

// Firebase Config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDtDlYCdA07dTwU3paVJHo21PMt-cCU55I",
  projectId: "yt-bot-defend",
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Collection names for web app (separate from Python tools)
const COLLECTIONS = {
  bots: 'webapp_bots',
  patterns: 'webapp_patterns',
  blacklist: 'webapp_blacklist',
  broadcasts: 'webapp_broadcasts',
  reports: 'webapp_reports',
  config: 'webapp_config',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert Firestore document format to JavaScript object
 */
function firestoreToDict(doc: any): Record<string, any> {
  const fields = doc.fields || {};
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields) as [string, any][]) {
    if ('stringValue' in value) {
      result[key] = value.stringValue;
    } else if ('integerValue' in value) {
      result[key] = parseInt(value.integerValue);
    } else if ('booleanValue' in value) {
      result[key] = value.booleanValue;
    } else if ('doubleValue' in value) {
      result[key] = value.doubleValue;
    } else if ('timestampValue' in value) {
      result[key] = value.timestampValue;
    } else if ('mapValue' in value) {
      result[key] = firestoreToDict(value.mapValue);
    } else if ('arrayValue' in value) {
      result[key] = (value.arrayValue.values || []).map((v: any) => {
        if ('mapValue' in v) return firestoreToDict(v.mapValue);
        return Object.values(v)[0];
      });
    }
  }

  // Add document ID
  if (doc.name) {
    result._id = doc.name.split('/').pop();
  }

  return result;
}

/**
 * Convert JavaScript object to Firestore document format
 */
function dictToFirestore(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_')) continue;

    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (Array.isArray(value)) {
      const arrayValues = value.map((item) => {
        if (typeof item === 'string') return { stringValue: item };
        if (typeof item === 'number') return { integerValue: String(item) };
        if (typeof item === 'object') return { mapValue: { fields: dictToFirestore(item) } };
        return { stringValue: String(item) };
      });
      fields[key] = { arrayValue: { values: arrayValues } };
    } else if (typeof value === 'object' && value !== null) {
      fields[key] = { mapValue: { fields: dictToFirestore(value) } };
    }
  }

  return fields;
}

// ==================== BOT TOKENS ====================

export interface CloudBotToken {
  id: string;
  name: string;
  channel_id: string;
  channel_url: string;
  avatar_url: string;
  enabled: boolean;
  has_token: boolean;
  token_data?: string; // JSON string of token (old format)
  // New format - direct token fields
  access_token?: string;
  refresh_token?: string;
}

/**
 * Get all bot tokens from Firebase (web app specific collection)
 */
export async function getCloudBots(): Promise<CloudBotToken[]> {
  try {
    // Try web app collection first, fallback to shared collection
    let url = `${BASE_URL}/${COLLECTIONS.bots}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[Firebase] Error getting bots:', response.status);
      return [];
    }

    const data = await response.json();
    const bots: CloudBotToken[] = [];

    for (const doc of data.documents || []) {
      const bot = firestoreToDict(doc) as CloudBotToken;
      if (bot.enabled !== false) {
        bots.push(bot);
      }
    }

    console.log(`[Firebase] Loaded ${bots.length} bots from cloud`);
    return bots;
  } catch (e) {
    console.error('[Firebase] Error:', e);
    return [];
  }
}

/**
 * Parse token data from cloud bot
 * Supports multiple formats:
 * - Direct: { access_token, refresh_token }
 * - Python tools: { tokens: { access_token, refresh_token }, channel_info: { id, snippet: { title } } }
 */
export function parseTokenData(tokenDataStr: string): {
  access_token: string;
  refresh_token: string;
  channel_id: string;
  channel_name?: string;
} | null {
  try {
    const data = JSON.parse(tokenDataStr);
    return {
      access_token: data.tokens?.access_token || data.access_token || '',
      refresh_token: data.tokens?.refresh_token || data.refresh_token || '',
      channel_id: data.channel_info?.id || data.channel_id || '',
      channel_name: data.channel_info?.snippet?.title || data.channel_info?.title || data.name || '',
    };
  } catch {
    return null;
  }
}

// ==================== SPAM PATTERNS ====================

export interface JudolPattern {
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  is_regex: boolean;
  is_active: boolean;
}

/**
 * Get judol/spam patterns from Firebase (web app specific)
 */
export async function getJudolPatterns(): Promise<JudolPattern[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.patterns}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[Firebase] Error getting patterns:', response.status);
      return [];
    }

    const data = await response.json();
    const patterns: JudolPattern[] = [];

    for (const doc of data.documents || []) {
      const pattern = firestoreToDict(doc) as JudolPattern;
      if (pattern.is_active !== false) {
        patterns.push(pattern);
      }
    }

    console.log(`[Firebase] Loaded ${patterns.length} spam patterns from cloud`);
    return patterns;
  } catch (e) {
    console.error('[Firebase] Error:', e);
    return [];
  }
}

// ==================== GLOBAL BLACKLIST ====================

export interface BlacklistEntry {
  user_id: string;
  username: string;
  reason: string;
  is_verified: boolean;
}

/**
 * Get global blacklist from Firebase (web app specific)
 */
export async function getGlobalBlacklist(verifiedOnly = true): Promise<BlacklistEntry[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.blacklist}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[Firebase] Error getting blacklist:', response.status);
      return [];
    }

    const data = await response.json();
    let blacklist: BlacklistEntry[] = [];

    for (const doc of data.documents || []) {
      blacklist.push(firestoreToDict(doc) as BlacklistEntry);
    }

    if (verifiedOnly) {
      blacklist = blacklist.filter((b) => b.is_verified);
    }

    console.log(`[Firebase] Loaded ${blacklist.length} blacklist entries from cloud`);
    return blacklist;
  } catch (e) {
    console.error('[Firebase] Error:', e);
    return [];
  }
}

/**
 * Check if user is globally blacklisted
 */
export async function isGloballyBlacklisted(userId: string): Promise<boolean> {
  const blacklist = await getGlobalBlacklist(true);
  return blacklist.some((b) => b.user_id === userId);
}

// ==================== SPAM REPORTS ====================

/**
 * Submit spam report to Firebase
 */
export async function submitSpamReport(
  reportType: 'false_positive' | 'false_negative',
  messageContent: string,
  detectedAs: string,
  channelId = ''
): Promise<boolean> {
  try {
    const reportId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const url = `${BASE_URL}/${COLLECTIONS.reports}/${reportId}?key=${FIREBASE_CONFIG.apiKey}`;

    const data = {
      report_type: reportType,
      message_content: messageContent.slice(0, 500),
      detected_as: detectedAs,
      reported_by: 'web_app',
      channel_id: channelId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: dictToFirestore(data) }),
    });

    if (response.ok) {
      console.log('[Firebase] Spam report submitted');
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Firebase] Submit report error:', e);
    return false;
  }
}

// ==================== REMOTE CONFIG ====================

export interface RemoteConfig {
  maintenance_mode: boolean;
  min_version: string;
  force_update: boolean;
  app_enabled: boolean;
  announcement: string;
  features: {
    detection: boolean;
    moderation: boolean;
    bot_commands: boolean;
    auto_messages: boolean;
  };
}

/**
 * Get remote config from Firebase
 */
export async function getRemoteConfig(): Promise<RemoteConfig> {
  const defaultConfig: RemoteConfig = {
    maintenance_mode: false,
    min_version: '1.0.0',
    force_update: false,
    app_enabled: true,
    announcement: '',
    features: {
      detection: true,
      moderation: true,
      bot_commands: true,
      auto_messages: true,
    },
  };

  try {
    const url = `${BASE_URL}/${COLLECTIONS.config}/app?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      return defaultConfig;
    }

    const data = await response.json();
    const config = firestoreToDict(data);
    return { ...defaultConfig, ...config } as RemoteConfig;
  } catch (e) {
    console.error('[Firebase] Remote config error:', e);
    return defaultConfig;
  }
}

// ==================== BROADCASTS ====================

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  created_at: string;
}

/**
 * Get active broadcasts from Firebase
 */
export async function getActiveBroadcasts(): Promise<Broadcast[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.broadcasts}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const broadcasts: Broadcast[] = [];

    for (const doc of data.documents || []) {
      const broadcast = firestoreToDict(doc) as Broadcast;
      if (broadcast.is_active) {
        broadcasts.push(broadcast);
      }
    }

    return broadcasts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (e) {
    console.error('[Firebase] Broadcasts error:', e);
    return [];
  }
}

/**
 * Get latest broadcast message
 */
export async function getLatestBroadcast(): Promise<string | null> {
  const broadcasts = await getActiveBroadcasts();
  if (broadcasts.length > 0) {
    const latest = broadcasts[0];
    return `📢 ${latest.title}: ${latest.message}`;
  }
  return null;
}

// ==================== KEYWORD SUBMISSIONS ====================

/**
 * Submit new keyword that wasn't detected
 */
export async function submitNewKeyword(
  keyword: string,
  originalMessage: string,
  channelId = ''
): Promise<boolean> {
  try {
    // Simple hash for keyword
    const keywordHash = keyword
      .toLowerCase()
      .split('')
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
      .toString(16)
      .slice(0, 12);

    const submissionId = `${keywordHash}_${Date.now()}`;
    const url = `${BASE_URL}/keyword_submissions/${submissionId}?key=${FIREBASE_CONFIG.apiKey}`;

    const data = {
      keyword: keyword.toLowerCase().trim(),
      original_message: originalMessage.slice(0, 500),
      submitted_by: 'web_app',
      channel_id: channelId,
      status: 'pending',
      vote_count: 1,
      created_at: new Date().toISOString(),
    };

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: dictToFirestore(data) }),
    });

    return response.ok;
  } catch (e) {
    console.error('[Firebase] Submit keyword error:', e);
    return false;
  }
}

// ==================== FIREBASE STATUS ====================

/**
 * Check Firebase connection status
 */
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.config}/app?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, { method: 'GET' });
    return response.ok || response.status === 404; // 404 means connected but doc not found
  } catch {
    return false;
  }
}

// ==================== USAGE TRACKING ====================

interface UsageData {
  total_api_calls: number;
  spam_detected: number;
  messages_deleted: number;
  users_banned: number;
  users_timeout: number;
  sessions_count: number;
}

/**
 * Get today's usage stats from Firebase
 */
async function getTodayUsage(): Promise<UsageData | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `${BASE_URL}/webapp_usage/${today}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return firestoreToDict(data) as UsageData;
  } catch {
    return null;
  }
}

/**
 * Track usage - increment counters in Firebase
 */
export async function trackUsage(
  field: 'total_api_calls' | 'spam_detected' | 'messages_deleted' | 'users_banned' | 'users_timeout' | 'sessions_count',
  amount: number = 1
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = await getTodayUsage();
    const currentValue = current ? (current[field] || 0) : 0;
    
    const url = `${BASE_URL}/webapp_usage/${today}?key=${FIREBASE_CONFIG.apiKey}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({
          date: today,
          [field]: currentValue + amount,
          updated_at: new Date().toISOString(),
        }),
      }),
    });
  } catch (e) {
    // Silent fail - don't break app for analytics
    console.error('[Firebase] Track usage error:', e);
  }
}

/**
 * Track new session start
 */
export async function trackSessionStart(): Promise<void> {
  await trackUsage('sessions_count', 1);
}

/**
 * Track API call
 */
export async function trackApiCall(count: number = 1): Promise<void> {
  await trackUsage('total_api_calls', count);
}

/**
 * Track spam detected
 */
export async function trackSpamDetected(count: number = 1): Promise<void> {
  await trackUsage('spam_detected', count);
}

/**
 * Track message deleted
 */
export async function trackMessageDeleted(count: number = 1): Promise<void> {
  await trackUsage('messages_deleted', count);
}

/**
 * Track user banned
 */
export async function trackUserBanned(): Promise<void> {
  await trackUsage('users_banned', 1);
}

/**
 * Track user timeout
 */
export async function trackUserTimeout(): Promise<void> {
  await trackUsage('users_timeout', 1);
}

// ==================== USER ACTIVITY TRACKING ====================

interface UserActivityData {
  user_id: string;
  channel_name: string;
  last_active: string;
  first_seen: string;
  total_sessions: number;
  total_spam_blocked: number;
  total_actions: number;
  device_info: string;
}

/**
 * Track user activity for admin dashboard
 * Called when user starts monitoring
 */
export async function trackUserActivity(
  channelId: string,
  channelName: string = ''
): Promise<void> {
  try {
    const safeUserId = channelId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const url = `${BASE_URL}/webapp_users/${safeUserId}?key=${FIREBASE_CONFIG.apiKey}`;
    
    // Get existing user data
    const existingResponse = await fetch(url);
    let existingData: UserActivityData | null = null;
    if (existingResponse.ok) {
      existingData = firestoreToDict(await existingResponse.json()) as UserActivityData;
    }
    
    const now = new Date().toISOString();
    const deviceInfo = `${navigator.userAgent.substring(0, 100)}`;
    
    const updateData: UserActivityData = {
      user_id: channelId,
      channel_name: channelName || existingData?.channel_name || '',
      last_active: now,
      first_seen: existingData?.first_seen || now,
      total_sessions: (existingData?.total_sessions || 0) + 1,
      total_spam_blocked: existingData?.total_spam_blocked || 0,
      total_actions: existingData?.total_actions || 0,
      device_info: deviceInfo,
    };
    
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: dictToFirestore(updateData) }),
    });
    
    console.log('[Firebase] User activity tracked:', channelId);
  } catch (e) {
    // Silent fail - don't break app for analytics
    console.error('[Firebase] Track user activity error:', e);
  }
}

/**
 * Update user stats (spam blocked, actions taken)
 */
export async function updateUserStats(
  channelId: string,
  field: 'total_spam_blocked' | 'total_actions',
  increment: number = 1
): Promise<void> {
  try {
    const safeUserId = channelId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const url = `${BASE_URL}/webapp_users/${safeUserId}?key=${FIREBASE_CONFIG.apiKey}`;
    
    // Get current value
    const response = await fetch(url);
    let currentValue = 0;
    if (response.ok) {
      const data = firestoreToDict(await response.json());
      currentValue = data[field] || 0;
    }
    
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({
          [field]: currentValue + increment,
          last_active: new Date().toISOString(),
        }),
      }),
    });
  } catch (e) {
    console.error('[Firebase] Update user stats error:', e);
  }
}
