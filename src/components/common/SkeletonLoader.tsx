import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 8,
  cols = 7,
}) => {
  return (
    <div className="w-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b border-slate-800 bg-slate-900/60">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-800 rounded skeleton-shimmer"
            style={{ width: `${Math.max(12, Math.floor(100 / cols))}%` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 p-4 border-b border-slate-800/50 bg-slate-900/20"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-slate-800/80 rounded skeleton-shimmer"
              style={{
                width: c === 0 ? '22%' : c === 1 ? '16%' : `${Math.floor(70 / cols)}%`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="w-24 h-4 bg-slate-800 rounded skeleton-shimmer" />
            <div className="w-8 h-8 rounded-xl bg-slate-800 skeleton-shimmer" />
          </div>
          <div className="w-16 h-7 bg-slate-700/80 rounded-lg skeleton-shimmer" />
          <div className="w-32 h-3 bg-slate-800/60 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
};
