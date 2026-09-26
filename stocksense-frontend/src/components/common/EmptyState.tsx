import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-8 h-8 text-gray-400" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
