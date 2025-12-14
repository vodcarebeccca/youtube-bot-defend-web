/**
 * Loading Components - Various loading animations
 */
import React from 'react';

// Spinner loading
export const Spinner: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color = '#10b981' 
}) => (
  <div 
    className="spinner"
    style={{ 
      width: size, 
      height: size,
      borderTopColor: color,
    }}
  />
);

// Dots loading
export const DotsLoading: React.FC<{ color?: string }> = ({ color = '#10b981' }) => (
  <div className="dots-loading">
    <span style={{ backgroundColor: color }} />
    <span style={{ backgroundColor: color }} />
    <span style={{ backgroundColor: color }} />
  </div>
);

// Pulse loading
export const PulseLoading: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color = '#10b981' 
}) => (
  <div 
    className="pulse-loading"
    style={{ 
      width: size, 
      height: size,
      backgroundColor: color,
    }}
  />
);

// Skeleton box
export const Skeleton: React.FC<{ 
  width?: string | number; 
  height?: string | number;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}> = ({ 
  width = '100%', 
  height = 16,
  className = '',
  rounded = 'md',
}) => {
  const roundedClass = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div 
      className={`skeleton ${roundedClass[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Skeleton card
export const SkeletonCard: React.FC = () => (
  <div className="bg-[#1a1a2e] p-5 rounded-xl border border-gray-800">
    <div className="flex items-center justify-between mb-3">
      <Skeleton width={96} height={16} />
      <Skeleton width={40} height={40} rounded="lg" />
    </div>
    <Skeleton width={80} height={32} className="mb-2" />
    <Skeleton width={128} height={12} />
  </div>
);

// Full page loading
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
    <Spinner size={40} />
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

// Button loading state
export const ButtonLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <span className="flex items-center gap-2">
    <Spinner size={16} color="white" />
    {text}
  </span>
);

// Progress bar
export const ProgressBar: React.FC<{ 
  value: number; 
  max?: number;
  showLabel?: boolean;
  color?: string;
}> = ({ 
  value, 
  max = 100,
  showLabel = false,
  color,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{value.toLocaleString()}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            background: color || undefined,
          }}
        />
      </div>
    </div>
  );
};

export default {
  Spinner,
  DotsLoading,
  PulseLoading,
  Skeleton,
  SkeletonCard,
  PageLoading,
  ButtonLoading,
  ProgressBar,
};
