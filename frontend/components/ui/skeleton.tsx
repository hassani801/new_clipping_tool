import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-shimmer rounded-xl bg-[#1C1C22]', className)}
      {...props}
    />
  );
}

export function ClipCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#141418] border border-white/5 p-4 flex flex-col gap-3">
      {/* 9:16 Video Thumbnail skeleton */}
      <Skeleton className="w-full aspect-[9/16] rounded-xl" />
      {/* Title & badge */}
      <div className="flex justify-between items-center gap-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      {/* Excerpt lines */}
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}
