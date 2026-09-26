import { cn } from '../../utils/cn';
import { STOCK_STATUS_CONFIG } from '../../utils/constants';
import type { StockStatus } from '../../types/common';

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export default function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const config = STOCK_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
