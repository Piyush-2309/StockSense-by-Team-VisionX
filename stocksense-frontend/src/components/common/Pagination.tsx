import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface PaginationProps {
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  size,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const startItem = page * size + 1;
  const endItem = Math.min((page + 1) * size, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="rounded-l-md rounded-r-none focus:z-20"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            
            <div className="px-4 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
              Page {page + 1} of {totalPages}
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-r-md rounded-l-none focus:z-20"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </div>
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
