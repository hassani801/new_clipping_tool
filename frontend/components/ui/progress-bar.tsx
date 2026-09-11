'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animatedGlow?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  animatedGlow = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-[#A1A1AA] mb-1.5 font-medium">
          <span>Progress</span>
          <span className="text-[#F5F5F7] font-mono">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-[#1C1C22] rounded-full overflow-hidden p-0.5 border border-white/5 relative',
          heights[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ ease: 'easeOut', duration: 0.5 }}
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-violet-600 via-pink-500 to-amber-400 relative',
            animatedGlow && 'shadow-[0_0_12px_rgba(236,72,153,0.5)]'
          )}
        >
          {animatedGlow && (
            <motion.div
              className="absolute inset-0 bg-white/25 rounded-full"
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
