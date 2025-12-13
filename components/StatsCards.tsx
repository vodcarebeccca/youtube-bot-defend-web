import React from 'react';
import { DashboardStats } from '../types';
import { MessageSquare, ShieldAlert, Gavel, Activity } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats;
  isMonitoring: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isMonitoring }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Total Chat</span>
          <MessageSquare size={20} className="text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.totalChat.toLocaleString()}</div>
      </div>

      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Spam Detected</span>
          <ShieldAlert size={20} className="text-red-500" />
        </div>
        <div className="text-2xl font-bold text-red-400">{stats.spamDetected.toLocaleString()}</div>
        {stats.totalChat > 0 && (
            <div className="text-xs text-gray-500 mt-1">
                {((stats.spamDetected / stats.totalChat) * 100).toFixed(1)}% Rate
            </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Actions Taken</span>
          <Gavel size={20} className="text-purple-500" />
        </div>
        <div className="text-2xl font-bold text-purple-400">{stats.actionsTaken.toLocaleString()}</div>
      </div>

      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">API Calls</span>
          <Activity size={20} className="text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.quotaUsed.toLocaleString()}</div>
        <div className="text-xs text-gray-500 mt-1">
          {isMonitoring ? '🟢 Using OAuth (no quota limit)' : 'Session calls'}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
