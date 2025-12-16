/**
 * YouTube OAuth Service for Video Comment Moderation
 * Handles Google OAuth login for channel owners to manage their video comments
 * User must login with their own YouTube account to delete comments on their videos
 */

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../constants';

// OAuth Scopes for YouTube comment management
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',  // Full access including comment moderation
  'https://www.googleapis.com/auth/youtube',            // Manage YouTube account
  'https://www.googleapis.com/auth/youtube.readonly',   // Read channel/videos
  'https://www.googleapis.com/auth/userinfo.profile',   // User profile
  'https://www.googleapis.com/auth/userinfo.email',     // User email
];

// Redirect URI for web app (must be configured in Google Cloud Console)
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/oauth/callback`
  : 'http://localhost:5173/oauth/callback';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OAuthState {
  isLoggedIn: boolean;
  user: UserInfo | null;
  channel: ChannelInfo | null;
  tokens: OAuthTokens | null;
}

// Storage keys
const STORAGE_KEY = 'youtube_oauth_state';

class YouTubeOAuthService {
  private state: OAuthState = {
    isLoggedIn: false,
    user: null,
    channel: null,
    tokens: null,
  };

  private listeners: Set<(state: OAuthState) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load saved OAuth state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = parsed;
        
        // Check if token is expired
        if (this.state.tokens && Date.now() > this.state.tokens.expiresAt) {
          console.log('[YouTubeOAuth] Token expired, will refresh on next use');
        }
        
        if (this.state.isLoggedIn) {
          console.log(`[YouTubeOAuth] Loaded session for: ${this.state.channel?.title || this.state.user?.name}`);
        }
      }
    } catch (e) {
      console.error('[YouTubeOAuth] Failed to load from storage:', e);
    }
  }

  /**
   * Save OAuth state to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('[YouTubeOAuth] Failed to save to storage:', e);
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: OAuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state); // Initial call
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current OAuth state
   */
  getState(): OAuthState {
    return { ...this.state };
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.state.isLoggedIn && !!this.state.tokens;
  }

  /**
   * Get channel ID of logged in user
   */
  getChannelId(): string | null {
    return this.state.channel?.id || null;
  }

  /**
   * Get channel name
   */
  getChannelName(): string {
    return this.state.channel?.title || this.state.user?.name || '';
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState(),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state);
    return state;
  }

  /**
   * Verify state parameter
   */
  private verifyState(state: string): boolean {
    const savedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');
    return state === savedState;
  }

  /**
   * Start OAuth login flow (opens popup or redirects)
   */
  login(): void {
    const authUrl = this.getAuthUrl();
    
    // Open in popup for better UX
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      authUrl,
      'youtube_oauth',
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    if (!popup) {
      // Popup blocked, redirect instead
      window.location.href = authUrl;
    }
  }

  /**
   * Handle OAuth callback (called from callback page)
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    // Verify state
    if (!this.verifyState(state)) {
      console.error('[YouTubeOAuth] Invalid state parameter');
      return false;
    }

    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCode(code);
      if (!tokens) {
        return false;
      }

      // Get user info
      const userInfo = await this.getUserInfo(tokens.accessToken);
      
      // Get channel info
      const channelInfo = await this.getChannelInfo(tokens.accessToken);

      // Update state
      this.state = {
        isLoggedIn: true,
        user: userInfo,
        channel: channelInfo,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + (tokens.expiresIn * 1000),
        },
      };

      this.saveToStorage();
      this.notifyListeners();

      console.log(`[YouTubeOAuth] ✅ Login successful: ${channelInfo?.title || userInfo?.name}`);
      return true;

    } catch (e) {
      console.error('[YouTubeOAuth] Callback error:', e);
      return false;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[YouTubeOAuth] Token exchange failed:', error);
        return null;
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (e) {
      console.error('[YouTubeOAuth] Token exchange error:', e);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    if (!this.state.tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: this.state.tokens.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error('[YouTubeOAuth] Token refresh failed');
        return false;
      }

      const data = await response.json();
      
      this.state.tokens = {
        ...this.state.tokens,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      this.saveToStorage();
      console.log('[YouTubeOAuth] ✅ Token refreshed');
      return true;

    } catch (e) {
      console.error('[YouTubeOAuth] Token refresh error:', e);
      return false;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.state.tokens) {
      return null;
    }

    // Refresh if expired or about to expire (5 min buffer)
    if (Date.now() > this.state.tokens.expiresAt - 300000) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        this.logout();
        return null;
      }
    }

    return this.state.tokens.accessToken;
  }

  /**
   * Get user info from Google
   */
  private async getUserInfo(accessToken: string): Promise<UserInfo | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get YouTube channel info
   */
  private async getChannelInfo(accessToken: string): Promise<ChannelInfo | null> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.items?.length) return null;

      const channel = data.items[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnailUrl: channel.snippet.thumbnails?.default?.url || '',
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.state = {
      isLoggedIn: false,
      user: null,
      channel: null,
      tokens: null,
    };

    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
    console.log('[YouTubeOAuth] ✅ Logged out');
  }
}

// Export singleton instance
export const youtubeOAuth = new YouTubeOAuthService();
