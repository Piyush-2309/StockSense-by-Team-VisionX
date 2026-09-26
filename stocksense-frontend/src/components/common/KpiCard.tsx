import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/formatters';

interface KpiCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  trend?: { value: number; label: string };
  onClick?: () => void;
  className?: string;
}

const colorMap = {
  default: 'text-gray-900',
  success: 'text-green-600',
  warning: 'text-amber-600',
  danger:  'text-red-600',
  info:    'text-blue-600',
};

const iconBgMap = {
  default: 'bg-primary-50 text-primary-600',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-amber-50 text-amber-600',
  danger:  'bg-red-50 text-red-600',
  info:    'bg-blue-50 text-blue-600',
};

export default function KpiCard({
  label,
  value,
  icon,
  color = 'default',
  trend,
  onClick,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-card border border-gray-100 shadow-card p-5',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-card-hover hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={cn('text-[28px] font-bold leading-tight', colorMap[color])}>
            {formatNumber(value)}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-gray-500">
              <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}
              </span>{' '}
              {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              iconBgMap[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
