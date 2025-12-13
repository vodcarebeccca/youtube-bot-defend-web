import React, { useEffect, useRef, useState } from 'react';
import { ModerationEntry, FilterType } from '../types';
import { Trash2, Clock, Ban, User, AlertTriangle, CheckCircle, Shield, XCircle } from 'lucide-react';

interface ModerationLogProps {
  entries: ModerationEntry[];
  onDelete: (id: string, entry: ModerationEntry) => void;
  onTimeout: (userId: string, entry: ModerationEntry) => void;
  onBan: (userId: string, entry: ModerationEntry) => void;
  filter: FilterType;
  setFilter: (f: FilterType) => void;
}

const ModerationLog: React.FC<ModerationLogProps> = ({ entries, onDelete, onTimeout, onBan, filter, setFilter }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Filter entries based on type
  const filteredEntries = entries.filter(entry => {
    if (filter === FilterType.SPAM_ONLY) return entry.type === 'spam_detected';
    if (filter === FilterType.CLEAN_ONLY) return entry.actionTaken; // Show only actioned entries
    return true;
  });

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
    setAutoScroll(isAtBottom);
  };

  // Get badge style based on entry type
  const getTypeBadge = (entry: ModerationEntry) => {
    switch (entry.type) {
      case 'deleted':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-900/50">
            <Trash2 size={10} /> DELETED
          </span>
        );
      case 'banned':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded border border-purple-900/50">
            <Ban size={10} /> BANNED
          </span>
        );
      case 'timeout':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-900/50">
            <Clock size={10} /> TIMEOUT
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-500 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30">
            <AlertTriangle size={10} /> SPAM ({entry.spamScore})
          </span>
        );
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 flex flex-col h-[600px]">
      {/* Header / Filter Toolbar */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Shield size={20} className="text-emerald-500" />
          Moderation Log
          <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-400">
            {filteredEntries.length}
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
            Pending
          </button>
          <button 
            onClick={() => setFilter(FilterType.CLEAN_ONLY)}
            className={`px-3 py-1 rounded text-sm ${filter === FilterType.CLEAN_ONLY ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-900' : 'text-gray-400 hover:text-white'}`}
          >
            Actioned
          </button>
        </div>
      </div>

      {/* Entries Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        onScroll={handleScroll}
      >
        {filteredEntries.length === 0 && (
          <div className="text-center text-gray-500 mt-20 flex flex-col items-center gap-3">
            <Shield size={48} className="text-gray-700" />
            <p>No moderation entries yet.</p>
            <p className="text-sm text-gray-600">Spam messages will appear here when detected.</p>
          </div>
        )}

        {filteredEntries.map((entry) => (
          <div 
            key={entry.id + entry.timestamp} 
            className={`group relative p-3 rounded-lg border flex gap-3 transition-colors ${
              entry.actionTaken 
                ? 'bg-emerald-900/10 border-emerald-900/30' 
                : 'bg-red-900/10 border-red-900/30 hover:bg-red-900/20'
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {entry.userPhoto ? (
                <img src={entry.userPhoto} alt="avi" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm truncate text-gray-300">
                  {entry.username}
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                {getTypeBadge(entry)}
                {entry.actionTaken && (
                  <span title="Action taken">
                    <CheckCircle size={14} className="text-emerald-500" />
                  </span>
                )}
              </div>
              
              <p className={`text-sm break-words whitespace-pre-wrap ${
                entry.actionTaken ? 'text-gray-400 line-through' : 'text-gray-200'
              }`}>
                {entry.message}
              </p>

              {/* Spam Details */}
              {entry.spamKeywords && entry.spamKeywords.length > 0 && (
                <div className="mt-2 text-xs text-red-400 font-mono">
                  Detected: {entry.spamKeywords.join(', ')}
                </div>
              )}
            </div>

            {/* Actions (only show if not actioned) */}
            {!entry.actionTaken && (
              <div className="flex flex-col gap-1 justify-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onDelete(entry.id, entry)}
                  title="Delete Message"
                  className="p-1.5 rounded bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  onClick={() => onTimeout(entry.userId, entry)}
                  title="Timeout User (5m)"
                  className="p-1.5 rounded bg-gray-800 hover:bg-amber-600 text-gray-400 hover:text-white transition-colors"
                >
                  <Clock size={14} />
                </button>
                <button 
                  onClick={() => onBan(entry.userId, entry)}
                  title="Ban User"
                  className="p-1.5 rounded bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white transition-colors"
                >
                  <Ban size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      {/* Footer */}
      <div className="p-2 border-t border-gray-800 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          💡 Buka YouTube untuk melihat live chat lengkap
        </span>
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

export default ModerationLog;
