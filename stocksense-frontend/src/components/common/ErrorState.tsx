import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Error</h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
