'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-[#141418]/60 border border-dashed border-white/10 my-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-5 shadow-lg shadow-pink-500/10">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-[#F5F5F7] tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-[#A1A1AA] max-w-md leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && onSecondaryAction && (
          <Button variant="secondary" size="md" onClick={onSecondaryAction}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
