import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { TableSkeleton } from '../common/LoadingState';
import Pagination from '../common/Pagination';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    size: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  pagination,
  className,
}: DataTableProps<T>) {
  if (loading && data.length === 0) {
    return (
      <div className={cn('bg-white rounded-card shadow-card border border-gray-100 overflow-hidden', className)}>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-card shadow-card border border-gray-100 flex flex-col overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={String(col.key) + idx}
                  scope="col"
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    col.width,
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 && !loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-center">
                  {emptyState || <div className="text-gray-500 py-8">No data available</div>}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx} // Ensure unique keys in actual usage, here we just use rowIdx if no id available
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={String(col.key) + colIdx}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      )}
                    >
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && data.length > 0 && (
        <Pagination
          page={pagination.page}
          size={pagination.size}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
