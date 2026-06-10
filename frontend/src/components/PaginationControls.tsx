import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className={`flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0] ${className}`}>
      <p className="text-xs text-[#475569]">
        Showing {start.toLocaleString()} to {end.toLocaleString()} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-[#475569] px-2">
          Page {page} of {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
          disabled={page >= (totalPages || 1)}
          className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
