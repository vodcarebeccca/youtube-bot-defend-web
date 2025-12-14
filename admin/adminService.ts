/**
 * Admin Service for Web App Admin Panel
 * Handles all Firebase operations for admin
 */

// Firebase Config (same as main app)
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDtDlYCdA07dTwU3paVJHo21PMt-cCU55I',
  projectId: 'yt-bot-defend',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Collection names for web app (separate from Python tools)
const COLLECTIONS = {
  bots: 'webapp_bots',
  patterns: 'webapp_patterns',
  blacklist: 'webapp_blacklist',
  broadcasts: 'webapp_broadcasts',
  reports: 'webapp_reports',
  licenses: 'webapp_licenses',
  config: 'webapp_config',
  analytics: 'webapp_analytics',
};

// ==================== HELPER FUNCTIONS ====================

function firestoreToDict(doc: any): Record<string, any> {
  const fields = doc.fields || {};
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields) as [string, any][]) {
    if ('stringValue' in value) result[key] = value.stringValue;
    else if ('integerValue' in value) result[key] = parseInt(value.integerValue);
    else if ('booleanValue' in value) result[key] = value.booleanValue;
    else if ('doubleValue' in value) result[key] = value.doubleValue;
    else if ('timestampValue' in value) result[key] = value.timestampValue;
    else if ('mapValue' in value) {
      // Handle nested objects (like features)
      result[key] = firestoreToDict(value.mapValue);
    } else if ('arrayValue' in value) {
      result[key] = (value.arrayValue.values || []).map((v: any) => {
        if ('mapValue' in v) return firestoreToDict(v.mapValue);
        return Object.values(v)[0];
      });
    }
  }

  if (doc.name) result._id = doc.name.split('/').pop();
  return result;
}

function dictToFirestore(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((item) =>
            typeof item === 'string' ? { stringValue: item } : { integerValue: String(item) }
          ),
        },
      };
    } else if (typeof value === 'object') {
      // Handle nested objects (like features)
      fields[key] = { mapValue: { fields: dictToFirestore(value) } };
    }
  }
  return fields;
}

// ==================== AUTH ====================

export function checkAdminAuth(): boolean {
  return localStorage.getItem('webAppAdminAuth') === 'authenticated';
}

// ==================== DASHBOARD STATS ====================

export async function getWebAppStats() {
  try {
    const [bots, patterns, blacklist, reports, licenses] = await Promise.all([
      getBots(),
      getSpamPatterns(),
      getBlacklist(),
      getSpamReports(),
      getLicenses(),
    ]);

    return {
      totalBots: bots.length,
      totalPatterns: patterns.length,
      totalBlacklist: blacklist.length,
      totalLicenses: licenses.filter((l) => l.status === 'active').length,
      pendingReports: reports.filter((r) => r.status === 'pending').length,
    };
  } catch (e) {
    console.error('[AdminService] Stats error:', e);
    return {
      totalBots: 0,
      totalPatterns: 0,
      totalBlacklist: 0,
      totalLicenses: 0,
      pendingReports: 0,
    };
  }
}

// ==================== BOTS ====================

export interface BotToken {
  _id?: string;
  name: string;
  channel_id: string;
  access_token: string;
  refresh_token: string;
  enabled: boolean;
  created_at: string;
}

export async function getBots(): Promise<BotToken[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.bots}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as BotToken[];
  } catch (e) {
    console.error('[AdminService] Get bots error:', e);
    return [];
  }
}

export async function addBot(bot: Omit<BotToken, '_id'>): Promise<boolean> {
  try {
    const botId = `bot_${Date.now()}`;
    const url = `${BASE_URL}/${COLLECTIONS.bots}/${botId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: dictToFirestore({ ...bot, created_at: new Date().toISOString() }) }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Add bot error:', e);
    return false;
  }
}

export async function deleteBot(botId: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.bots}/${botId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, { method: 'DELETE' });
    return response.ok || response.status === 404;
  } catch (e) {
    console.error('[AdminService] Delete bot error:', e);
    return false;
  }
}

// ==================== SPAM PATTERNS ====================

export interface SpamPattern {
  _id?: string;
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  is_regex: boolean;
  is_active: boolean;
  created_at: string;
}

export async function getSpamPatterns(): Promise<SpamPattern[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.patterns}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as SpamPattern[];
  } catch (e) {
    console.error('[AdminService] Get patterns error:', e);
    return [];
  }
}

export async function addSpamPattern(pattern: Omit<SpamPattern, '_id'>): Promise<boolean> {
  try {
    const patternId = `pattern_${Date.now()}`;
    const url = `${BASE_URL}/${COLLECTIONS.patterns}/${patternId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({ ...pattern, created_at: new Date().toISOString() }),
      }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Add pattern error:', e);
    return false;
  }
}

export async function deleteSpamPattern(patternId: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.patterns}/${patternId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, { method: 'DELETE' });
    return response.ok || response.status === 404;
  } catch (e) {
    console.error('[AdminService] Delete pattern error:', e);
    return false;
  }
}

// ==================== BLACKLIST ====================

export interface BlacklistEntry {
  _id?: string;
  user_id: string;
  username: string;
  reason: string;
  is_verified: boolean;
  created_at: string;
}

export async function getBlacklist(): Promise<BlacklistEntry[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.blacklist}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as BlacklistEntry[];
  } catch (e) {
    console.error('[AdminService] Get blacklist error:', e);
    return [];
  }
}

export async function addToBlacklist(entry: Omit<BlacklistEntry, '_id'>): Promise<boolean> {
  try {
    const entryId = `bl_${Date.now()}`;
    const url = `${BASE_URL}/${COLLECTIONS.blacklist}/${entryId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({ ...entry, created_at: new Date().toISOString() }),
      }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Add blacklist error:', e);
    return false;
  }
}

export async function removeFromBlacklist(entryId: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.blacklist}/${entryId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, { method: 'DELETE' });
    return response.ok || response.status === 404;
  } catch (e) {
    console.error('[AdminService] Remove blacklist error:', e);
    return false;
  }
}

// ==================== BROADCASTS ====================

export interface Broadcast {
  _id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  created_at: string;
}

export async function getBroadcasts(): Promise<Broadcast[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.broadcasts}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as Broadcast[];
  } catch (e) {
    console.error('[AdminService] Get broadcasts error:', e);
    return [];
  }
}

export async function sendBroadcast(broadcast: Omit<Broadcast, '_id'>): Promise<boolean> {
  try {
    const broadcastId = `bc_${Date.now()}`;
    const url = `${BASE_URL}/${COLLECTIONS.broadcasts}/${broadcastId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({ ...broadcast, created_at: new Date().toISOString() }),
      }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Send broadcast error:', e);
    return false;
  }
}

export async function deleteBroadcast(broadcastId: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.broadcasts}/${broadcastId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, { method: 'DELETE' });
    return response.ok || response.status === 404;
  } catch (e) {
    console.error('[AdminService] Delete broadcast error:', e);
    return false;
  }
}

// ==================== SPAM REPORTS ====================

export interface SpamReport {
  _id?: string;
  report_type: 'false_positive' | 'false_negative';
  message_content: string;
  detected_as: string;
  reported_by: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_note?: string;
  created_at: string;
}

export async function getSpamReports(): Promise<SpamReport[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.reports}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as SpamReport[];
  } catch (e) {
    console.error('[AdminService] Get reports error:', e);
    return [];
  }
}

export async function updateSpamReport(
  reportId: string,
  status: string,
  adminNote: string
): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.reports}/${reportId}?key=${FIREBASE_CONFIG.apiKey}&updateMask.fieldPaths=status&updateMask.fieldPaths=admin_note`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({ status, admin_note: adminNote }),
      }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Update report error:', e);
    return false;
  }
}

// ==================== LICENSES ====================

export interface License {
  _id?: string;
  license_key: string;
  user_email: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}

export async function getLicenses(): Promise<License[]> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.licenses}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as License[];
  } catch (e) {
    console.error('[AdminService] Get licenses error:', e);
    return [];
  }
}

export async function addLicense(license: Omit<License, '_id'>): Promise<boolean> {
  try {
    const licenseId = `lic_${Date.now()}`;
    const url = `${BASE_URL}/${COLLECTIONS.licenses}/${licenseId}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({ ...license, created_at: new Date().toISOString() }),
      }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Add license error:', e);
    return false;
  }
}

export async function revokeLicense(licenseId: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.licenses}/${licenseId}?key=${FIREBASE_CONFIG.apiKey}&updateMask.fieldPaths=status`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({ status: 'revoked' }),
      }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Revoke license error:', e);
    return false;
  }
}

// ==================== REMOTE CONFIG ====================

export interface RemoteConfig {
  maintenance_mode: boolean;
  app_enabled: boolean;
  min_version: string;
  announcement: string;
  features: {
    auto_delete: boolean;
    auto_ban: boolean;
    cloud_patterns: boolean;
    license_required: boolean;
  };
}

export async function getRemoteConfig(): Promise<RemoteConfig> {
  const defaultConfig: RemoteConfig = {
    maintenance_mode: false,
    app_enabled: true,
    min_version: '1.0.0',
    announcement: '',
    features: {
      auto_delete: true,
      auto_ban: true,
      cloud_patterns: true,
      license_required: false,
    },
  };

  try {
    const url = `${BASE_URL}/${COLLECTIONS.config}/app?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return defaultConfig;
    const data = await response.json();
    return { ...defaultConfig, ...firestoreToDict(data) } as RemoteConfig;
  } catch (e) {
    console.error('[AdminService] Get config error:', e);
    return defaultConfig;
  }
}

export async function updateRemoteConfig(config: Partial<RemoteConfig>): Promise<boolean> {
  try {
    const url = `${BASE_URL}/${COLLECTIONS.config}/app?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: dictToFirestore(config as Record<string, any>) }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AdminService] Update config failed:', response.status, errorData);
      // Check if it's a permission error
      if (response.status === 403 || response.status === 401) {
        console.error('[AdminService] Permission denied - check Firebase security rules');
      }
    }
    
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Update config error:', e);
    return false;
  }
}

// ==================== ANALYTICS ====================

export async function logAnalytics(event: string, data: Record<string, any> = {}): Promise<void> {
  try {
    const eventId = `${event}_${Date.now()}`;
    const url = `${BASE_URL}/${COLLECTIONS.analytics}/${eventId}?key=${FIREBASE_CONFIG.apiKey}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({
          event,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      }),
    });
  } catch (e) {
    // Silent fail for analytics
  }
}

// ==================== USAGE STATS ====================

export interface UsageStats {
  _id?: string;
  date: string;
  total_api_calls: number;
  spam_detected: number;
  messages_deleted: number;
  users_banned: number;
  users_timeout: number;
  sessions_count: number;
  updated_at: string;
}

export async function getUsageStats(): Promise<UsageStats[]> {
  try {
    const url = `${BASE_URL}/webapp_usage?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as UsageStats[];
  } catch (e) {
    console.error('[AdminService] Get usage stats error:', e);
    return [];
  }
}

export async function getTodayUsage(): Promise<UsageStats | null> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const url = `${BASE_URL}/webapp_usage/${today}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return firestoreToDict(data) as UsageStats;
  } catch (e) {
    console.error('[AdminService] Get today usage error:', e);
    return null;
  }
}

export async function incrementUsage(field: 'total_api_calls' | 'spam_detected' | 'messages_deleted' | 'users_banned' | 'users_timeout' | 'sessions_count', amount: number = 1): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current stats
    const current = await getTodayUsage();
    const currentValue = current ? (current[field] || 0) : 0;
    
    const url = `${BASE_URL}/webapp_usage/${today}?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url, {
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
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Increment usage error:', e);
    return false;
  }
}

export async function getTotalUsage(): Promise<{
  totalApiCalls: number;
  totalSpamDetected: number;
  totalDeleted: number;
  totalBanned: number;
  totalTimeout: number;
  totalSessions: number;
  todayApiCalls: number;
  todaySpamDetected: number;
}> {
  try {
    const allStats = await getUsageStats();
    const today = new Date().toISOString().split('T')[0];
    const todayStats = allStats.find(s => s.date === today);
    
    const totals = allStats.reduce((acc, stat) => ({
      totalApiCalls: acc.totalApiCalls + (stat.total_api_calls || 0),
      totalSpamDetected: acc.totalSpamDetected + (stat.spam_detected || 0),
      totalDeleted: acc.totalDeleted + (stat.messages_deleted || 0),
      totalBanned: acc.totalBanned + (stat.users_banned || 0),
      totalTimeout: acc.totalTimeout + (stat.users_timeout || 0),
      totalSessions: acc.totalSessions + (stat.sessions_count || 0),
    }), {
      totalApiCalls: 0,
      totalSpamDetected: 0,
      totalDeleted: 0,
      totalBanned: 0,
      totalTimeout: 0,
      totalSessions: 0,
    });
    
    return {
      ...totals,
      todayApiCalls: todayStats?.total_api_calls || 0,
      todaySpamDetected: todayStats?.spam_detected || 0,
    };
  } catch (e) {
    console.error('[AdminService] Get total usage error:', e);
    return {
      totalApiCalls: 0,
      totalSpamDetected: 0,
      totalDeleted: 0,
      totalBanned: 0,
      totalTimeout: 0,
      totalSessions: 0,
      todayApiCalls: 0,
      todaySpamDetected: 0,
    };
  }
}

// ==================== USER TRACKING ====================

export interface UserActivity {
  _id?: string;
  user_id: string;
  channel_name?: string;
  email?: string;
  last_active: string;
  first_seen: string;
  total_sessions: number;
  total_spam_blocked: number;
  total_actions: number;
  device_info?: string;
}

/**
 * Get all tracked users
 */
export async function getActiveUsers(): Promise<UserActivity[]> {
  try {
    const url = `${BASE_URL}/webapp_users?key=${FIREBASE_CONFIG.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.documents || []).map(firestoreToDict) as UserActivity[];
  } catch (e) {
    console.error('[AdminService] Get users error:', e);
    return [];
  }
}

/**
 * Track user activity (called from web app when user logs in/uses app)
 */
export async function trackUserActivity(userData: {
  user_id: string;
  channel_name?: string;
  email?: string;
  device_info?: string;
}): Promise<boolean> {
  try {
    const userId = userData.user_id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const url = `${BASE_URL}/webapp_users/${userId}?key=${FIREBASE_CONFIG.apiKey}`;
    
    // Get existing user data
    const existingResponse = await fetch(url);
    let existingData: UserActivity | null = null;
    if (existingResponse.ok) {
      existingData = firestoreToDict(await existingResponse.json()) as UserActivity;
    }
    
    const now = new Date().toISOString();
    const updateData: UserActivity = {
      user_id: userData.user_id,
      channel_name: userData.channel_name || existingData?.channel_name || '',
      email: userData.email || existingData?.email || '',
      last_active: now,
      first_seen: existingData?.first_seen || now,
      total_sessions: (existingData?.total_sessions || 0) + 1,
      total_spam_blocked: existingData?.total_spam_blocked || 0,
      total_actions: existingData?.total_actions || 0,
      device_info: userData.device_info || existingData?.device_info || '',
    };
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: dictToFirestore(updateData) }),
    });
    return response.ok;
  } catch (e) {
    console.error('[AdminService] Track user error:', e);
    return false;
  }
}

/**
 * Update user stats (spam blocked, actions taken)
 */
export async function updateUserStats(
  userId: string, 
  field: 'total_spam_blocked' | 'total_actions',
  increment: number = 1
): Promise<boolean> {
  try {
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const url = `${BASE_URL}/webapp_users/${safeUserId}?key=${FIREBASE_CONFIG.apiKey}`;
    
    // Get current value
    const response = await fetch(url);
    let currentValue = 0;
    if (response.ok) {
      const data = firestoreToDict(await response.json());
      currentValue = data[field] || 0;
    }
    
    const updateResponse = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({
          [field]: currentValue + increment,
          last_active: new Date().toISOString(),
        }),
      }),
    });
    return updateResponse.ok;
  } catch (e) {
    console.error('[AdminService] Update user stats error:', e);
    return false;
  }
}

/**
 * Get user statistics summary
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  topUsers: UserActivity[];
}> {
  try {
    const users = await getActiveUsers();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let activeToday = 0;
    let activeThisWeek = 0;
    let activeThisMonth = 0;
    let newUsersToday = 0;
    let newUsersThisWeek = 0;
    
    for (const user of users) {
      const lastActive = new Date(user.last_active);
      const firstSeen = new Date(user.first_seen);
      
      if (lastActive >= today) activeToday++;
      if (lastActive >= weekAgo) activeThisWeek++;
      if (lastActive >= monthAgo) activeThisMonth++;
      if (firstSeen >= today) newUsersToday++;
      if (firstSeen >= weekAgo) newUsersThisWeek++;
    }
    
    // Top users by total actions
    const topUsers = [...users]
      .sort((a, b) => (b.total_actions + b.total_spam_blocked) - (a.total_actions + a.total_spam_blocked))
      .slice(0, 10);
    
    return {
      totalUsers: users.length,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      newUsersToday,
      newUsersThisWeek,
      topUsers,
    };
  } catch (e) {
    console.error('[AdminService] Get user stats error:', e);
    return {
      totalUsers: 0,
      activeToday: 0,
      activeThisWeek: 0,
      activeThisMonth: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      topUsers: [],
    };
  }
}
