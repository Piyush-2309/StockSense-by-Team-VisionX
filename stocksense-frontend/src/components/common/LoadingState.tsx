import { cn } from '../../utils/cn';

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded', className)} />;
}

export function TableSkeleton({ rows = 5 }: LoadingStateProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <LoadingSkeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-gray-100">
          {[1, 2, 3, 4, 5].map((j) => (
            <LoadingSkeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-card border border-gray-100 shadow-card p-5">
          <LoadingSkeleton className="h-3 w-20 mb-3" />
          <LoadingSkeleton className="h-8 w-16 mb-2" />
          <LoadingSkeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
