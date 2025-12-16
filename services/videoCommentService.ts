/**
 * Video Comment Service for YouTube Bot Defend
 * Handles fetching, monitoring, and moderating video comments
 * Uses user's own OAuth token (not bot tokens) for comment deletion
 */

import { youtubeOAuth } from './youtubeOAuth';
import { detectJudol } from './spamDetection';

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  channelId: string;
  channelTitle: string;
}

export interface VideoComment {
  id: string;
  videoId: string;
  authorChannelId: string;
  authorName: string;
  authorProfileImage: string;
  text: string;
  publishedAt: string;
  updatedAt: string;
  likeCount: number;
  replyCount: number;
  isReply: boolean;
  parentId?: string;
  // Spam detection fields
  isSpam?: boolean;
  spamScore?: number;
  spamKeywords?: string[];
  // Moderation fields
  isDeleted?: boolean;
  isHeld?: boolean;
}

export interface CommentStats {
  totalComments: number;
  spamDetected: number;
  commentsDeleted: number;
  commentsHeld: number;
  lastChecked: string | null;
}

// API quota costs
const QUOTA_COSTS = {
  videos_list: 1,
  channels_list: 1,
  commentThreads_list: 1,
  comments_list: 1,
  comments_delete: 50,
  comments_setModerationStatus: 50,
};

class VideoCommentService {
  private processedCommentIds: Set<string> = new Set();
  private stats: CommentStats = {
    totalComments: 0,
    spamDetected: 0,
    commentsDeleted: 0,
    commentsHeld: 0,
    lastChecked: null,
  };

  /**
   * Get list of videos from user's channel
   */
  async getMyVideos(maxResults: number = 50): Promise<VideoInfo[]> {
    const accessToken = await youtubeOAuth.getAccessToken();
    if (!accessToken) {
      throw new Error('Not logged in. Please login with your YouTube account.');
    }

    const channelId = youtubeOAuth.getChannelId();
    if (!channelId) {
      throw new Error('Channel not found. Please login again.');
    }

    try {
      // First get uploads playlist ID
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel info');
      }

      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return [];
      }

      // Get videos from uploads playlist
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!playlistResponse.ok) {
        throw new Error('Failed to fetch videos');
      }

      const playlistData = await playlistResponse.json();
      const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId) || [];

      if (videoIds.length === 0) {
        return [];
      }

      // Get video details including statistics
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!videosResponse.ok) {
        throw new Error('Failed to fetch video details');
      }

      const videosData = await videosResponse.json();
      
      return videosData.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || '',
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount) || 0,
        likeCount: parseInt(video.statistics.likeCount) || 0,
        commentCount: parseInt(video.statistics.commentCount) || 0,
        duration: video.contentDetails.duration,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
      })) || [];

    } catch (e: any) {
      console.error('[VideoCommentService] getMyVideos error:', e);
      throw e;
    }
  }

  /**
   * Get video info by ID
   */
  async getVideoInfo(videoId: string): Promise<VideoInfo | null> {
    const accessToken = await youtubeOAuth.getAccessToken();
    if (!accessToken) {
      throw new Error('Not logged in');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.items?.length) {
        return null;
      }

      const video = data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails?.medium?.url || '',
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount) || 0,
        likeCount: parseInt(video.statistics.likeCount) || 0,
        commentCount: parseInt(video.statistics.commentCount) || 0,
        duration: video.contentDetails.duration,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get comments for a video with spam detection
   */
  async getVideoComments(
    videoId: string,
    pageToken?: string,
    maxResults: number = 100,
    customSpamWords: string[] = []
  ): Promise<{
    comments: VideoComment[];
    nextPageToken?: string;
    totalResults: number;
  }> {
    const accessToken = await youtubeOAuth.getAccessToken();
    if (!accessToken) {
      throw new Error('Not logged in');
    }

    try {
      let url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=${maxResults}&order=time&textFormat=plainText`;
      
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error?.errors?.[0]?.reason === 'commentsDisabled') {
          throw new Error('Comments are disabled on this video');
        }
        throw new Error(error.error?.message || 'Failed to fetch comments');
      }

      const data = await response.json();
      const comments: VideoComment[] = [];

      for (const item of data.items || []) {
        // Top-level comment
        const topComment = this.parseComment(item.snippet.topLevelComment, videoId);
        
        // Run spam detection
        const spamResult = detectJudol(topComment.text, customSpamWords);
        topComment.isSpam = spamResult.score >= 50;
        topComment.spamScore = spamResult.score;
        topComment.spamKeywords = spamResult.keywords;

        // Always add to comments array for display
        comments.push(topComment);
        
        // Only update stats for new comments
        if (!this.processedCommentIds.has(topComment.id)) {
          this.processedCommentIds.add(topComment.id);
          this.stats.totalComments++;
          if (topComment.isSpam) {
            this.stats.spamDetected++;
          }
        }

        // Replies
        if (item.replies?.comments) {
          for (const reply of item.replies.comments) {
            const replyComment = this.parseComment(reply, videoId, item.snippet.topLevelComment.id);
            
            const replySpamResult = detectJudol(replyComment.text, customSpamWords);
            replyComment.isSpam = replySpamResult.score >= 50;
            replyComment.spamScore = replySpamResult.score;
            replyComment.spamKeywords = replySpamResult.keywords;

            // Always add to comments array for display
            comments.push(replyComment);
            
            // Only update stats for new comments
            if (!this.processedCommentIds.has(replyComment.id)) {
              this.processedCommentIds.add(replyComment.id);
              this.stats.totalComments++;
              if (replyComment.isSpam) {
                this.stats.spamDetected++;
              }
            }
          }
        }
      }

      this.stats.lastChecked = new Date().toISOString();

      return {
        comments,
        nextPageToken: data.nextPageToken,
        totalResults: data.pageInfo?.totalResults || 0,
      };

    } catch (e: any) {
      console.error('[VideoCommentService] getVideoComments error:', e);
      throw e;
    }
  }

  /**
   * Parse YouTube API comment to VideoComment format
   */
  private parseComment(commentData: any, videoId: string, parentId?: string): VideoComment {
    const snippet = commentData.snippet;
    return {
      id: commentData.id,
      videoId,
      authorChannelId: snippet.authorChannelId?.value || '',
      authorName: snippet.authorDisplayName || 'Unknown',
      authorProfileImage: snippet.authorProfileImageUrl || '',
      text: snippet.textDisplay || snippet.textOriginal || '',
      publishedAt: snippet.publishedAt,
      updatedAt: snippet.updatedAt || snippet.publishedAt,
      likeCount: snippet.likeCount || 0,
      replyCount: commentData.snippet?.totalReplyCount || 0,
      isReply: !!parentId,
      parentId,
    };
  }

  /**
   * Delete a comment (only works on user's own channel videos)
   */
  async deleteComment(commentId: string): Promise<boolean> {
    const accessToken = await youtubeOAuth.getAccessToken();
    if (!accessToken) {
      throw new Error('Not logged in');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/comments?id=${commentId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 204) {
        this.stats.commentsDeleted++;
        console.log(`[VideoCommentService] ✅ Comment deleted: ${commentId}`);
        return true;
      }

      if (response.status === 403) {
        const error = await response.json();
        if (error.error?.errors?.[0]?.reason === 'forbidden') {
          throw new Error('You can only delete comments on your own videos');
        }
        throw new Error(error.error?.message || 'Permission denied');
      }

      return false;
    } catch (e: any) {
      console.error('[VideoCommentService] deleteComment error:', e);
      throw e;
    }
  }

  /**
   * Set comment moderation status (hold for review / reject)
   */
  async setModerationStatus(
    commentId: string,
    status: 'heldForReview' | 'rejected' | 'published'
  ): Promise<boolean> {
    const accessToken = await youtubeOAuth.getAccessToken();
    if (!accessToken) {
      throw new Error('Not logged in');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/comments/setModerationStatus?id=${commentId}&moderationStatus=${status}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 204) {
        if (status === 'heldForReview') {
          this.stats.commentsHeld++;
        }
        console.log(`[VideoCommentService] ✅ Comment ${status}: ${commentId}`);
        return true;
      }

      return false;
    } catch (e: any) {
      console.error('[VideoCommentService] setModerationStatus error:', e);
      throw e;
    }
  }

  /**
   * Batch delete multiple comments
   */
  async deleteComments(commentIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of commentIds) {
      try {
        const deleted = await this.deleteComment(id);
        if (deleted) {
          success.push(id);
        } else {
          failed.push(id);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * Get moderation statistics
   */
  getStats(): CommentStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalComments: 0,
      spamDetected: 0,
      commentsDeleted: 0,
      commentsHeld: 0,
      lastChecked: null,
    };
    this.processedCommentIds.clear();
  }

  /**
   * Check if video belongs to logged in user's channel
   */
  async isMyVideo(videoId: string): Promise<boolean> {
    const channelId = youtubeOAuth.getChannelId();
    if (!channelId) return false;

    const videoInfo = await this.getVideoInfo(videoId);
    return videoInfo?.channelId === channelId;
  }
}

// Export singleton instance
export const videoCommentService = new VideoCommentService();
