import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationMeta } from '@/constants/pagination';

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PaginationControls({ pagination, onPageChange, className = '' }: PaginationControlsProps) {
  const { page, total, totalPages, limit } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className={`flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3 shadow-sm ${className}`}>
      {/* Left: Showing range */}
      <div className="text-sm text-slate-600">
        Showing <span className="text-slate-900 font-semibold">{start.toLocaleString()}</span> to <span className="text-slate-900 font-semibold">{end.toLocaleString()}</span> of <span className="text-slate-900 font-semibold">{total.toLocaleString()}</span>
      </div>

      {/* Center: first / prev / page input / next / last */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div>
          <input
            type="number"
            value={page}
            onChange={(e) => {
              const newPage = Number(e.target.value);
              if (!isNaN(newPage) && newPage >= 1 && newPage <= (totalPages || 1)) {
                onPageChange(newPage);
              }
            }}
            className="w-16 px-2 py-1 text-center border border-slate-200 rounded-md focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 font-semibold"
            min={1}
            max={totalPages || 1}
            aria-label="Page number"
          />
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
          disabled={page >= (totalPages || 1)}
          className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages || 1)}
          disabled={page >= (totalPages || 1)}
          className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Page X of Y */}
      <div className="text-sm text-slate-600">
        Page <span className="text-slate-900 font-semibold">{page}</span> of <span className="text-slate-900 font-semibold">{totalPages || 1}</span>
      </div>
    </div>
  );
}
