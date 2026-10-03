import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems?: number;
  currentCount: number;
  hasMore: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrev: () => void;
  onFirst?: () => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  currentCount,
  hasMore,
  hasPrevious,
  onNext,
  onPrev,
  onFirst,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  loading = false,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = startItem + currentCount - 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-400">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-vipto-500 transition-colors"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="hidden sm:inline text-slate-500">|</span>
        <span className="hidden sm:inline">
          {currentCount > 0 ? (
            <>
              Showing <span className="font-semibold text-slate-200">{startItem}</span> to{' '}
              <span className="font-semibold text-slate-200">{endItem}</span>
              {totalItems !== undefined && (
                <>
                  {' '}
                  of <span className="font-semibold text-slate-200">{totalItems}</span>
                </>
              )}
            </>
          ) : (
            'No records to display'
          )}
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <span className="mr-2 font-medium text-slate-300">
          Page {currentPage}
        </span>

        {onFirst && (
          <button
            onClick={onFirst}
            disabled={!hasPrevious || loading}
            title="First Page"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onPrev}
          disabled={!hasPrevious || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          onClick={onNext}
          disabled={!hasMore || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
