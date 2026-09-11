'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
  elevation?: '1' | '2' | '3';
  glow?: boolean;
  interactive?: boolean;
}

export function Card({
  className,
  elevation = '1',
  glow = false,
  interactive = false,
  children,
  ...props
}: CardProps) {
  const elevations = {
    '1': 'bg-[#141418] border border-white/[0.07]',
    '2': 'bg-[#1C1C22] border border-white/[0.09]',
    '3': 'bg-[#24242C] border border-white/[0.12]',
  };

  return (
    <motion.div
      whileHover={interactive ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'rounded-2xl relative overflow-hidden transition-shadow',
        elevations[elevation],
        glow && 'shadow-xl shadow-pink-500/10 border-pink-500/30',
        interactive && 'hover:border-white/20 hover:shadow-xl hover:shadow-black/50 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
