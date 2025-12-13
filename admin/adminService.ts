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
    else if ('arrayValue' in value) {
      result[key] = (value.arrayValue.values || []).map((v: any) => Object.values(v)[0]);
    }
  }

  if (doc.name) result._id = doc.name.split('/').pop();
  return result;
}

function dictToFirestore(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((item) =>
            typeof item === 'string' ? { stringValue: item } : { integerValue: String(item) }
          ),
        },
      };
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
