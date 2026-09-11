import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'pro' | 'success' | 'warning' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-[#24242C] text-[#A1A1AA] border border-white/5',
    gradient:
      'bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30',
    pro: 'bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold shadow-sm shadow-pink-500/30 border border-white/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    outline: 'bg-transparent text-[#A1A1AA] border border-white/15',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 shrink-0 select-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
