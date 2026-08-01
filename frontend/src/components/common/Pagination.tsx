'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/**
 * Shared numbered pagination with ellipsis collapsing, extracted from the
 * pattern originally on the products listing page. Always shows first/last
 * page plus a window of 1 around the current page.
 */
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers: (number | 'ellipsis')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
      pageNumbers.push(p);
    } else if (p === page - 2 || p === page + 2) {
      pageNumbers.push('ellipsis');
    }
  }

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {pageNumbers.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-500">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={page === p ? 'page' : undefined}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              page === p ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </nav>
  );
}
