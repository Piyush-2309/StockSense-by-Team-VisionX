import { cn } from '../../utils/cn';
import { STATUS_CONFIG } from '../../utils/constants';
import type { MoveStatus } from '../../types/common';

interface StatusBadgeProps {
  status: MoveStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.bg,
        config.color,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
}
