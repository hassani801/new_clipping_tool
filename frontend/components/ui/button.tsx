'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl';

    const variants = {
      primary:
        'bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white shadow-lg shadow-pink-500/20 active:shadow-none border border-white/10',
      secondary:
        'bg-[#1C1C22] hover:bg-[#25252D] text-[#F5F5F7] border border-white/10 hover:border-white/20',
      outline:
        'bg-transparent hover:bg-white/5 text-[#F5F5F7] border border-white/15 hover:border-white/30',
      ghost:
        'bg-transparent hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]',
      danger:
        'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20',
    };

    const sizes = {
      sm: 'text-xs h-8 px-3 gap-1.5',
      md: 'text-sm h-10 px-4 gap-2',
      lg: 'text-base h-12 px-6 gap-2.5 font-semibold',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.12 }}
        disabled={disabled || loading}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
            <span className="opacity-80">{children}</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
