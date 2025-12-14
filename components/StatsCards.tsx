import React, { useEffect, useRef, useState } from 'react';
import { DashboardStats } from '../types';
import { Trash2, ShieldAlert, Gavel, Activity } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats;
  isMonitoring: boolean;
  isLoading?: boolean;
}

// Animated counter hook
const useAnimatedCounter = (value: number, duration = 800) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const startValue = prevValue.current;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (value - startValue) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
};

// Skeleton card component
const SkeletonCard: React.FC = () => (
  <div className="bg-[#1a1a2e] p-5 rounded-xl border border-gray-800">
    <div className="flex items-center justify-between mb-3">
      <div className="skeleton w-24 h-4" />
      <div className="skeleton w-10 h-10 rounded-lg" />
    </div>
    <div className="skeleton w-20 h-8 mb-2" />
    <div className="skeleton w-32 h-3" />
  </div>
);

// Animated stat card component
const AnimatedStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  subtext?: string;
}> = ({ icon, label, value, color, bgColor, subtext }) => {
  const animatedValue = useAnimatedCounter(value);

  return (
    <div className="stat-card-animated bg-[#1a1a2e] p-5 rounded-xl border border-gray-800 cursor-default">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          {icon}
        </div>
      </div>
      <div 
        className="text-3xl font-bold counter-animated"
        style={{ color }}
      >
        {animatedValue.toLocaleString()}
      </div>
      {subtext && (
        <div className="text-xs text-gray-500 mt-1">{subtext}</div>
      )}
    </div>
  );
};

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isMonitoring, isLoading = false }) => {
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <AnimatedStatCard
        icon={<Trash2 size={20} className="text-red-400" />}
        label="Chat Dihapus"
        value={stats.actionsTaken}
        color="#f87171"
        bgColor="rgba(239, 68, 68, 0.2)"
      />

      <AnimatedStatCard
        icon={<ShieldAlert size={20} className="text-red-400" />}
        label="Spam Terdeteksi"
        value={stats.spamDetected}
        color="#f87171"
        bgColor="rgba(239, 68, 68, 0.2)"
        subtext={stats.spamDetected > 0 && stats.actionsTaken > 0 
          ? `${((stats.actionsTaken / stats.spamDetected) * 100).toFixed(0)}% Ditindak`
          : undefined
        }
      />

      <AnimatedStatCard
        icon={<Gavel size={20} className="text-purple-400" />}
        label="Aksi Diambil"
        value={stats.actionsTaken}
        color="#c084fc"
        bgColor="rgba(139, 92, 246, 0.2)"
      />

      <AnimatedStatCard
        icon={<Activity size={20} className="text-emerald-400" />}
        label="API Calls"
        value={stats.quotaUsed}
        color="#34d399"
        bgColor="rgba(16, 185, 129, 0.2)"
        subtext={isMonitoring ? '🟢 Pakai OAuth' : 'Panggilan sesi ini'}
      />
    </div>
  );
};

export default StatsCards;
