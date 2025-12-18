/**
 * Video Comments Page - Monitor and moderate comments on your YouTube videos
 * Requires user OAuth login (not bot tokens)
 */
import React, { useState, useEffect, useRef } from 'react';
import { youtubeOAuth, OAuthState } from '../services/youtubeOAuth';
import { videoCommentService, VideoInfo, VideoComment, CommentStats } from '../services/videoCommentService';
import { useToast } from '../contexts/ToastContext';

// Icons
const LoginIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const VideoCommentsPage: React.FC = () => {
  const toast = useToast();
  
  // OAuth state
  const [authState, setAuthState] = useState<OAuthState>(youtubeOAuth.getState());
  
  // Data state
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set()); // Multi-select
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [stats, setStats] = useState<CommentStats>(videoCommentService.getStats());
  
  // Max videos that can be selected
  const MAX_SELECTED_VIDEOS = 10;
  
  // UI state
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [filter, setFilter] = useState<'all' | 'spam' | 'clean'>('all');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [countdown, setCountdown] = useState(0);
  const autoRefreshRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Subscribe to OAuth state changes
  useEffect(() => {
    const unsubscribe = youtubeOAuth.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  // Listen for OAuth popup success message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'oauth_success') {
        // Reload page to get fresh OAuth state from localStorage
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load videos when logged in
  useEffect(() => {
    if (authState.isLoggedIn) {
      loadVideos();
    }
  }, [authState.isLoggedIn]);

  // Auto-refresh logic for multi-video
  useEffect(() => {
    // Clear existing intervals
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (autoRefresh && selectedVideos.size > 0 && !isLoadingComments) {
      // Set initial countdown
      setCountdown(refreshInterval);
      
      // Countdown timer (every second)
      countdownRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return refreshInterval;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-refresh timer
      autoRefreshRef.current = window.setInterval(() => {
        if (selectedVideos.size > 0) {
          loadCommentsForSelectedVideos();
        }
      }, refreshInterval * 1000);
    } else {
      setCountdown(0);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, selectedVideos.size]);

  const loadVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const myVideos = await videoCommentService.getMyVideos(20);
      setVideos(myVideos);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load videos');
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Load comments for multiple selected videos
  const loadCommentsForSelectedVideos = async () => {
    if (selectedVideos.size === 0) return;
    
    setIsLoadingComments(true);
    videoCommentService.resetStats();
    
    try {
      const allComments: VideoComment[] = [];
      const selectedVideosList = videos.filter(v => selectedVideos.has(v.id));
      
      for (const video of selectedVideosList) {
        try {
          const result = await videoCommentService.getVideoComments(video.id);
          // Add video title to each comment for reference
          const commentsWithVideo = result.comments.map(c => ({
            ...c,
            videoTitle: video.title,
          }));
          allComments.push(...commentsWithVideo);
        } catch (e: any) {
          console.error(`Failed to load comments for ${video.title}:`, e);
        }
      }
      
      // Sort by date (newest first)
      allComments.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      setComments(allComments);
      setStats(videoCommentService.getStats());
    } catch (e: any) {
      toast.error(e.message || 'Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Toggle video selection
  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        if (next.size >= MAX_SELECTED_VIDEOS) {
          toast.warning(`Maximum ${MAX_SELECTED_VIDEOS} videos can be selected`);
          return prev;
        }
        next.add(videoId);
      }
      return next;
    });
  };

  // Start scanning selected videos
  const handleScanSelected = () => {
    if (selectedVideos.size === 0) {
      toast.warning('Please select at least 1 video');
      return;
    }
    setComments([]);
    setNextPageToken(undefined);
    videoCommentService.resetStats();
    loadCommentsForSelectedVideos();
  };

  // Clear selection
  const clearVideoSelection = () => {
    setSelectedVideos(new Set());
    setComments([]);
    videoCommentService.resetStats();
    setStats(videoCommentService.getStats());
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await videoCommentService.deleteComment(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, isDeleted: true } : c
      ));
      setStats(videoCommentService.getStats());
      toast.success('Comment deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete comment');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedComments.size === 0) return;
    
    const ids = Array.from(selectedComments);
    const result = await videoCommentService.deleteComments(ids);
    
    setComments(prev => prev.map(c => 
      result.success.includes(c.id) ? { ...c, isDeleted: true } : c
    ));
    
    setSelectedComments(new Set());
    setStats(videoCommentService.getStats());
    
    if (result.success.length > 0) {
      toast.success(`Deleted ${result.success.length} comments`);
    }
    if (result.failed.length > 0) {
      toast.warning(`Failed to delete ${result.failed.length} comments`);
    }
  };

  const handleLogin = () => {
    youtubeOAuth.login();
  };

  const handleLogout = () => {
    youtubeOAuth.logout();
    setVideos([]);
    setSelectedVideos(new Set());
    setComments([]);
  };

  const toggleSelectComment = (id: string) => {
    setSelectedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllSpam = () => {
    const spamIds = comments.filter(c => c.isSpam && !c.isDeleted).map(c => c.id);
    setSelectedComments(new Set(spamIds));
  };

  const filteredComments = comments.filter(c => {
    if (c.isDeleted) return false;
    if (filter === 'spam') return c.isSpam;
    if (filter === 'clean') return !c.isSpam;
    return true;
  });

  // Not logged in view
  if (!authState.isLoggedIn) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-6xl mb-6">💬</div>
          <h1 className="text-2xl font-bold text-white mb-4">Moderasi Komentar Video</h1>
          <p className="text-gray-400 mb-8">
            Pantau dan moderasi komentar di video YouTube kamu. 
            Login dengan akun YouTube untuk memulai.
          </p>
          
          <div className="bg-[#1a1a2e] rounded-xl p-6 mb-8 text-left">
            <h3 className="text-white font-semibold mb-4">🔐 Kenapa Harus Login?</h3>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Kamu hanya bisa hapus komentar di <strong className="text-white">video milikmu sendiri</strong></li>
              <li>• Bot token tidak bisa hapus komentar video (batasan YouTube API)</li>
              <li>• Login kamu aman dan hanya digunakan untuk moderasi komentar</li>
              <li>• Kami tidak menyimpan password, hanya OAuth token</li>
            </ul>
          </div>

          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <LoginIcon />
            Login dengan YouTube
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Moderasi Komentar Video</h1>
          <p className="text-gray-400 text-sm">
            Login sebagai: <span className="text-emerald-400">{authState.channel?.title || authState.user?.name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {authState.channel && (
            <img 
              src={authState.channel.thumbnailUrl} 
              alt="" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1a2e] rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{stats.totalComments}</div>
          <div className="text-gray-400 text-sm">Total Dipindai</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{stats.spamDetected}</div>
          <div className="text-gray-400 text-sm">Spam Terdeteksi</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-400">{stats.commentsDeleted}</div>
          <div className="text-gray-400 text-sm">Dihapus</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{videos.length}</div>
          <div className="text-gray-400 text-sm">Video</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Video List */}
        <div className="w-80 flex-shrink-0 bg-[#1a1a2e] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-white">Video Saya</h2>
              <button
                onClick={loadVideos}
                disabled={isLoadingVideos}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshIcon />
              </button>
            </div>
            {/* Selection info and actions */}
            <div className="flex items-center justify-between">
              <span className={`text-xs ${selectedVideos.size >= MAX_SELECTED_VIDEOS ? 'text-yellow-400' : 'text-gray-400'}`}>
                {selectedVideos.size}/{MAX_SELECTED_VIDEOS} dipilih
              </span>
              <div className="flex gap-2">
                {selectedVideos.size > 0 && (
                  <button
                    onClick={clearVideoSelection}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Hapus
                  </button>
                )}
                <button
                  onClick={handleScanSelected}
                  disabled={selectedVideos.size === 0 || isLoadingComments}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selectedVideos.size > 0 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoadingComments ? 'Memindai...' : 'Pindai Terpilih'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoadingVideos ? (
              <div className="p-4 text-center text-gray-400">Memuat video...</div>
            ) : videos.length === 0 ? (
              <div className="p-4 text-center text-gray-400">Tidak ada video ditemukan</div>
            ) : (
              videos.map(video => (
                <div
                  key={video.id}
                  className={`p-3 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors ${
                    selectedVideos.has(video.id) ? 'bg-emerald-900/20 border-l-2 border-l-emerald-500' : ''
                  }`}
                >
                  <div className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(video.id)}
                      onChange={() => toggleVideoSelection(video.id)}
                      className="mt-3 w-4 h-4 rounded accent-emerald-500"
                    />
                    <div 
                      className="flex gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleVideoSelection(video.id)}
                    >
                      <img 
                        src={video.thumbnailUrl} 
                        alt="" 
                        className="w-20 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium line-clamp-2">{video.title}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          💬 {video.commentCount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comments Panel */}
        <div className="flex-1 bg-[#1a1a2e] rounded-xl overflow-hidden flex flex-col">
          {selectedVideos.size > 0 ? (
            <>
              {/* Selected Videos Info Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">
                      Memantau {selectedVideos.size} video
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {videos.filter(v => selectedVideos.has(v.id)).slice(0, 5).map(v => (
                        <span key={v.id} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {v.title.length > 25 ? v.title.substring(0, 25) + '...' : v.title}
                        </span>
                      ))}
                      {selectedVideos.size > 5 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                          +{selectedVideos.size - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div>Total Komentar: {videos.filter(v => selectedVideos.has(v.id)).reduce((sum, v) => sum + v.commentCount, 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Filter & Actions Bar */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                  {(['all', 'spam', 'clean'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        filter === f 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'spam' ? '🚨 Spam' : '✅ Clean'}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Auto-refresh toggle */}
                  <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        autoRefresh ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoRefresh ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <span className="text-gray-300 text-sm">Auto</span>
                    {autoRefresh && (
                      <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="bg-gray-700 text-white text-xs rounded px-1 py-0.5"
                      >
                        <option value={15}>15s</option>
                        <option value={30}>30s</option>
                        <option value={60}>1m</option>
                        <option value={120}>2m</option>
                      </select>
                    )}
                    {autoRefresh && countdown > 0 && (
                      <span className="text-emerald-400 text-xs font-mono">{countdown}s</span>
                    )}
                  </div>

                  <button
                    onClick={selectAllSpam}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Pilih Semua Spam
                  </button>
                  {selectedComments.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center gap-1"
                    >
                      <TrashIcon />
                      Hapus ({selectedComments.size})
                    </button>
                  )}
                  <button
                    onClick={loadCommentsForSelectedVideos}
                    disabled={isLoadingComments}
                    className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${isLoadingComments ? 'animate-spin' : ''}`}
                  >
                    <RefreshIcon />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingComments && comments.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="animate-pulse">Memindai {selectedVideos.size} video...</div>
                  </div>
                ) : filteredComments.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    {filter === 'spam' ? 'Tidak ada spam terdeteksi 🎉' : 'Tidak ada komentar. Klik "Pindai Terpilih" untuk memuat komentar.'}
                  </div>
                ) : (
                  <>
                    {filteredComments.map(comment => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        isSelected={selectedComments.has(comment.id)}
                        onToggleSelect={() => toggleSelectComment(comment.id)}
                        onDelete={() => handleDeleteComment(comment.id)}
                        showVideoTitle={selectedVideos.size > 1}
                      />
                    ))}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">👈</div>
                <p>Pilih 1-{MAX_SELECTED_VIDEOS} video untuk memantau komentar</p>
                <p className="text-sm mt-2">Gunakan checkbox untuk memilih beberapa video</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Comment Card Component with video title support
const CommentCard: React.FC<{
  comment: VideoComment & { videoTitle?: string };
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  showVideoTitle?: boolean;
}> = ({ comment, isSelected, onToggleSelect, onDelete, showVideoTitle = false }) => {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      comment.isSpam 
        ? 'bg-red-900/20 border-red-500/30' 
        : 'bg-gray-800/50 border-gray-700/50'
    } ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}>
      {/* Video title badge for multi-video mode */}
      {showVideoTitle && comment.videoTitle && (
        <div className="mb-2 pb-2 border-b border-gray-700/50">
          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
            📹 {comment.videoTitle.length > 40 ? comment.videoTitle.substring(0, 40) + '...' : comment.videoTitle}
          </span>
        </div>
      )}
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="mt-1 w-4 h-4 rounded"
        />
        
        <img 
          src={comment.authorProfileImage} 
          alt="" 
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium text-sm">{comment.authorName}</span>
            {comment.isSpam && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                SPAM {comment.spamScore}%
              </span>
            )}
            <span className="text-gray-500 text-xs">
              {new Date(comment.publishedAt).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
            {comment.text}
          </p>
          
          {comment.spamKeywords && comment.spamKeywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {comment.spamKeywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>👍 {comment.likeCount}</span>
            {comment.replyCount > 0 && <span>💬 {comment.replyCount} balasan</span>}
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex-shrink-0"
          title="Hapus komentar"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

export default VideoCommentsPage;
