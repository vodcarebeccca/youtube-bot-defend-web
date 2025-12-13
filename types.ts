export interface UserProfile {
  displayName: string;
  photoUrl: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userPhoto: string;
  message: string;
  timestamp: string;
  isModerator: boolean;
  isOwner: boolean;
  isSpam?: boolean;
  spamScore?: number;
  spamKeywords?: string[];
  deleted?: boolean; // UI state
}

export interface DashboardStats {
  totalChat: number;
  spamDetected: number;
  actionsTaken: number;
  quotaUsed: number;
}

export interface SpamResult {
  isSpam: boolean;
  score: number;
  keywords: string[];
}

export enum FilterType {
  ALL = 'ALL',
  SPAM_ONLY = 'SPAM_ONLY',      // Pending (spam detected, not actioned)
  CLEAN_ONLY = 'CLEAN_ONLY'     // Actioned (deleted/banned/timeout)
}

// Moderation Log Entry - for the new Moderation Log Viewer
export interface ModerationEntry {
  id: string;
  type: 'spam_detected' | 'deleted' | 'timeout' | 'banned';
  username: string;
  userId: string;
  userPhoto?: string;
  message: string;
  spamScore?: number;
  spamKeywords?: string[];
  timestamp: string;
  actionTaken: boolean;
}

export interface AppSettings {
  autoDelete: boolean;
  autoTimeout: boolean;
  autoBan: boolean;
  soundEnabled: boolean;
  spamThreshold: number;
  whitelist: string[];
  blacklist: string[];
  // New features
  aiDetectionEnabled: boolean;  // 6. AI Detection Toggle
  customSpamWords: string[];    // 7. Custom Spam Words
}

// Moderator Status
export interface ModeratorStatus {
  isModerator: boolean;
  isOwner: boolean;
  botName: string;
  error?: string;
}
