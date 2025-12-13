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
  SPAM_ONLY = 'SPAM_ONLY',
  CLEAN_ONLY = 'CLEAN_ONLY'
}

export interface AppSettings {
  autoDelete: boolean;
  autoTimeout: boolean;
  autoBan: boolean;
  soundEnabled: boolean;
  spamThreshold: number;
  whitelist: string[];
  blacklist: string[];
}
