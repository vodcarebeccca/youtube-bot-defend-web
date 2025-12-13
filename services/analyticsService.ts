/**
 * Analytics Service - Real-time analytics data from Firebase
 */

// Firebase Config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDtDlYCdA07dTwU3paVJHo21PMt-cCU55I",
  projectId: "yt-bot-defend",
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// ==================== TYPES ====================

export interface DailyStats {
  date: string;
  totalMessages: number;
  spamBlocked: number;
  actionsTaken: number;
  spamByType: {
    judol: number;
    link: number;
    toxic: number;
    other: number;
  };
}

export interface AnalyticsData {
  totalMessages: number;
  spamBlocked: number;
  actionsTaken: number;
  accuracy: number;
  spamByType: {
    judol: number;
    link: number;
    toxic: number;
    other: number;
  };
  dailyData: DailyStats[];
  trends: {
    messages: number;
    spam: number;
    actions: number;
    accuracy: number;
  };
}

// ==================== HELPER FUNCTIONS ====================

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
    } else if ('mapValue' in value) {
      result[key] = firestoreToDict(value.mapValue);
    }
  }

  if (doc.name) {
    result._id = doc.name.split('/').pop();
  }

  return result;
}

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
    } else if (typeof value === 'object' && value !== null) {
      fields[key] = { mapValue: { fields: dictToFirestore(value) } };
    }
  }

  return fields;
}

// Get date string in YYYY-MM-DD format
function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

// Get last N days dates
function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(getDateString(date));
  }
  return dates;
}

// ==================== RECORD ANALYTICS ====================

/**
 * Record a spam detection event
 */
export async function recordSpamDetection(
  spamType: 'judol' | 'link' | 'toxic' | 'other',
  actionTaken: boolean = false
): Promise<void> {
  try {
    const today = getDateString();
    const docUrl = `${BASE_URL}/webapp_analytics/${today}?key=${FIREBASE_CONFIG.apiKey}`;
    
    // Get current data
    const response = await fetch(docUrl);
    let currentData: DailyStats = {
      date: today,
      totalMessages: 0,
      spamBlocked: 0,
      actionsTaken: 0,
      spamByType: { judol: 0, link: 0, toxic: 0, other: 0 },
    };

    if (response.ok) {
      const doc = await response.json();
      const parsed = firestoreToDict(doc);
      currentData = {
        date: today,
        totalMessages: parsed.totalMessages || 0,
        spamBlocked: parsed.spamBlocked || 0,
        actionsTaken: parsed.actionsTaken || 0,
        spamByType: {
          judol: parsed.spamByType?.judol || 0,
          link: parsed.spamByType?.link || 0,
          toxic: parsed.spamByType?.toxic || 0,
          other: parsed.spamByType?.other || 0,
        },
      };
    }

    // Update counters
    currentData.spamBlocked += 1;
    currentData.spamByType[spamType] += 1;
    if (actionTaken) {
      currentData.actionsTaken += 1;
    }

    // Save back
    await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: dictToFirestore(currentData) }),
    });
  } catch (e) {
    console.error('[Analytics] Record spam error:', e);
  }
}

/**
 * Record a message scan (for total messages count)
 */
export async function recordMessageScan(count: number = 1): Promise<void> {
  try {
    const today = getDateString();
    const docUrl = `${BASE_URL}/webapp_analytics/${today}?key=${FIREBASE_CONFIG.apiKey}`;
    
    const response = await fetch(docUrl);
    let totalMessages = 0;

    if (response.ok) {
      const doc = await response.json();
      const parsed = firestoreToDict(doc);
      totalMessages = parsed.totalMessages || 0;
    }

    await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({
          date: today,
          totalMessages: totalMessages + count,
        }),
      }),
    });
  } catch (e) {
    console.error('[Analytics] Record message error:', e);
  }
}

/**
 * Record an action taken (delete/timeout/ban)
 */
export async function recordAction(): Promise<void> {
  try {
    const today = getDateString();
    const docUrl = `${BASE_URL}/webapp_analytics/${today}?key=${FIREBASE_CONFIG.apiKey}`;
    
    const response = await fetch(docUrl);
    let actionsTaken = 0;

    if (response.ok) {
      const doc = await response.json();
      const parsed = firestoreToDict(doc);
      actionsTaken = parsed.actionsTaken || 0;
    }

    await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: dictToFirestore({
          date: today,
          actionsTaken: actionsTaken + 1,
        }),
      }),
    });
  } catch (e) {
    console.error('[Analytics] Record action error:', e);
  }
}

// ==================== FETCH ANALYTICS ====================

/**
 * Get analytics data for a specific date range
 */
export async function getAnalyticsData(days: number = 7): Promise<AnalyticsData> {
  const defaultData: AnalyticsData = {
    totalMessages: 0,
    spamBlocked: 0,
    actionsTaken: 0,
    accuracy: 0,
    spamByType: { judol: 0, link: 0, toxic: 0, other: 0 },
    dailyData: [],
    trends: { messages: 0, spam: 0, actions: 0, accuracy: 0 },
  };

  try {
    const dates = getLastNDays(days);
    const dailyData: DailyStats[] = [];
    
    // Fetch all days data
    for (const date of dates) {
      const docUrl = `${BASE_URL}/webapp_analytics/${date}?key=${FIREBASE_CONFIG.apiKey}`;
      const response = await fetch(docUrl);
      
      if (response.ok) {
        const doc = await response.json();
        const parsed = firestoreToDict(doc);
        dailyData.push({
          date,
          totalMessages: parsed.totalMessages || 0,
          spamBlocked: parsed.spamBlocked || 0,
          actionsTaken: parsed.actionsTaken || 0,
          spamByType: {
            judol: parsed.spamByType?.judol || 0,
            link: parsed.spamByType?.link || 0,
            toxic: parsed.spamByType?.toxic || 0,
            other: parsed.spamByType?.other || 0,
          },
        });
      } else {
        // No data for this day
        dailyData.push({
          date,
          totalMessages: 0,
          spamBlocked: 0,
          actionsTaken: 0,
          spamByType: { judol: 0, link: 0, toxic: 0, other: 0 },
        });
      }
    }

    // Calculate totals
    let totalMessages = 0;
    let spamBlocked = 0;
    let actionsTaken = 0;
    const spamByType = { judol: 0, link: 0, toxic: 0, other: 0 };

    for (const day of dailyData) {
      totalMessages += day.totalMessages;
      spamBlocked += day.spamBlocked;
      actionsTaken += day.actionsTaken;
      spamByType.judol += day.spamByType.judol;
      spamByType.link += day.spamByType.link;
      spamByType.toxic += day.spamByType.toxic;
      spamByType.other += day.spamByType.other;
    }

    // Calculate accuracy (actions taken / spam blocked)
    const accuracy = spamBlocked > 0 ? Math.round((actionsTaken / spamBlocked) * 100) : 0;

    // Calculate trends (compare last half vs first half)
    const midPoint = Math.floor(days / 2);
    const firstHalf = dailyData.slice(0, midPoint);
    const secondHalf = dailyData.slice(midPoint);

    const firstHalfMessages = firstHalf.reduce((sum, d) => sum + d.totalMessages, 0);
    const secondHalfMessages = secondHalf.reduce((sum, d) => sum + d.totalMessages, 0);
    const firstHalfSpam = firstHalf.reduce((sum, d) => sum + d.spamBlocked, 0);
    const secondHalfSpam = secondHalf.reduce((sum, d) => sum + d.spamBlocked, 0);
    const firstHalfActions = firstHalf.reduce((sum, d) => sum + d.actionsTaken, 0);
    const secondHalfActions = secondHalf.reduce((sum, d) => sum + d.actionsTaken, 0);

    const calcTrend = (first: number, second: number) => {
      if (first === 0) return second > 0 ? 100 : 0;
      return Math.round(((second - first) / first) * 100);
    };

    return {
      totalMessages,
      spamBlocked,
      actionsTaken,
      accuracy: Math.min(accuracy, 100),
      spamByType,
      dailyData,
      trends: {
        messages: calcTrend(firstHalfMessages, secondHalfMessages),
        spam: calcTrend(firstHalfSpam, secondHalfSpam),
        actions: calcTrend(firstHalfActions, secondHalfActions),
        accuracy: 0, // Accuracy trend not calculated
      },
    };
  } catch (e) {
    console.error('[Analytics] Fetch error:', e);
    return defaultData;
  }
}

/**
 * Get spam type from keywords
 */
export function getSpamType(keywords: string[]): 'judol' | 'link' | 'toxic' | 'other' {
  const keywordStr = keywords.join(' ').toLowerCase();
  
  // Check for toxic/vulgar
  const toxicWords = ['ngentot', 'memek', 'kontol', 'pepek', 'jembut', 'titit', 'toket', 'vulgar'];
  if (toxicWords.some(w => keywordStr.includes(w))) {
    return 'toxic';
  }
  
  // Check for judol/gambling
  const judolWords = ['slot', 'gacor', 'maxwin', 'jp', 'jackpot', 'dana', 'wd', 'depo', 'judol', 'gambling', 'togel', 'casino'];
  if (judolWords.some(w => keywordStr.includes(w))) {
    return 'judol';
  }
  
  // Check for link spam
  const linkWords = ['link', 'http', 'www', '.com', '.id', 'wa.me', 't.me', 'bit.ly'];
  if (linkWords.some(w => keywordStr.includes(w))) {
    return 'link';
  }
  
  return 'other';
}
