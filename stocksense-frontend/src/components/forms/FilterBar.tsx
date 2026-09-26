import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export default function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 p-4 bg-white border-b border-gray-100', className)}>
      {children}
    </div>
  );
}
