import React from 'react';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-800/50 ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800/40 space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2 flex-1 mr-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <Skeleton className="h-3.5 w-full mt-2" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-800/30">
      <div className="flex items-center space-x-4 flex-1">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800/40 flex flex-col h-[400px]">
      <div className="space-y-2 mb-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-6 border-b border-slate-800/40">
        <Skeleton className="h-1/3 flex-1 rounded-t-lg" />
        <Skeleton className="h-2/3 flex-1 rounded-t-lg" />
        <Skeleton className="h-1/2 flex-1 rounded-t-lg" />
        <Skeleton className="h-5/6 flex-1 rounded-t-lg" />
        <Skeleton className="h-3/4 flex-1 rounded-t-lg" />
        <Skeleton className="h-2/3 flex-1 rounded-t-lg" />
      </div>
      <div className="flex justify-between mt-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
