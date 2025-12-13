import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, FilterType } from '../types';
import { Trash2, Clock, Ban, User, AlertTriangle } from 'lucide-react';

interface ChatListProps {
  messages: ChatMessage[];
  onDelete: (id: string) => void;
  onTimeout: (userId: string) => void;
  onBan: (userId: string) => void;
  filter: FilterType;
  setFilter: (f: FilterType) => void;
}

const ChatList: React.FC<ChatListProps> = ({ messages, onDelete, onTimeout, onBan, filter, setFilter }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Filter messages logic
  const filteredMessages = messages.filter(msg => {
    if (msg.deleted) return false;
    if (filter === FilterType.SPAM_ONLY) return msg.isSpam;
    if (filter === FilterType.CLEAN_ONLY) return !msg.isSpam;
    return true;
  });

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop === clientHeight;
    // If user scrolls up, disable autoscroll. If at bottom, enable.
    if (!isAtBottom) {
        setAutoScroll(false);
    } else {
        setAutoScroll(true);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 flex flex-col h-[600px]">
      {/* Header / Filter Toolbar */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
            Live Chat
            <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-400">
                {filteredMessages.length}
            </span>
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={() => setFilter(FilterType.ALL)}
                className={`px-3 py-1 rounded text-sm ${filter === FilterType.ALL ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                All
            </button>
            <button 
                onClick={() => setFilter(FilterType.SPAM_ONLY)}
                className={`px-3 py-1 rounded text-sm ${filter === FilterType.SPAM_ONLY ? 'bg-red-900/50 text-red-200 border border-red-900' : 'text-gray-400 hover:text-white'}`}
            >
                Spam Only
            </button>
             <button 
                onClick={() => setFilter(FilterType.CLEAN_ONLY)}
                className={`px-3 py-1 rounded text-sm ${filter === FilterType.CLEAN_ONLY ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-900' : 'text-gray-400 hover:text-white'}`}
            >
                Clean
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        onScroll={handleScroll}
      >
        {filteredMessages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
                No messages found for this filter.
            </div>
        )}

        {filteredMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`group relative p-3 rounded-lg border flex gap-3 transition-colors ${
                msg.isSpam 
                ? 'bg-red-900/10 border-red-900/30 hover:bg-red-900/20' 
                : 'bg-[#252525] border-transparent hover:border-gray-700'
            }`}
          >
             {/* Avatar */}
            <div className="flex-shrink-0">
                {msg.userPhoto ? (
                    <img src={msg.userPhoto} alt="avi" className="w-8 h-8 rounded-full" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <User size={16} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm truncate ${msg.isOwner ? 'text-yellow-500' : msg.isModerator ? 'text-blue-400' : 'text-gray-300'}`}>
                        {msg.username}
                    </span>
                    <span className="text-xs text-gray-600">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.isSpam && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-500 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30">
                            <AlertTriangle size={10} /> SPAM ({msg.spamScore})
                        </span>
                    )}
                </div>
                
                <p className="text-sm text-gray-200 break-words whitespace-pre-wrap">
                    {msg.message}
                </p>

                {/* Spam Details (Debug) */}
                {msg.isSpam && msg.spamKeywords && msg.spamKeywords.length > 0 && (
                    <div className="mt-2 text-xs text-red-400 font-mono">
                        Detected: {msg.spamKeywords.join(', ')}
                    </div>
                )}
            </div>

            {/* Actions (Visible on hover or persistent on mobile) */}
            <div className="flex flex-col gap-1 justify-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onDelete(msg.id)}
                    title="Delete Message"
                    className="p-1.5 rounded bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
                >
                    <Trash2 size={14} />
                </button>
                <button 
                    onClick={() => onTimeout(msg.userId)}
                    title="Timeout User (5m)"
                    className="p-1.5 rounded bg-gray-800 hover:bg-amber-600 text-gray-400 hover:text-white transition-colors"
                >
                    <Clock size={14} />
                </button>
                <button 
                    onClick={() => onBan(msg.userId)}
                    title="Ban User"
                    className="p-1.5 rounded bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white transition-colors"
                >
                    <Ban size={14} />
                </button>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      {/* Footer / Auto Scroll Toggle */}
      <div className="p-2 border-t border-gray-800 flex justify-end">
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded ${autoScroll ? 'text-emerald-500' : 'text-gray-500'}`}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
      </div>
    </div>
  );
};

export default ChatList;
