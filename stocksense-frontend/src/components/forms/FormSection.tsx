import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('md:grid md:grid-cols-3 md:gap-6 py-6 border-b border-gray-200 last:border-0', className)}>
      <div className="md:col-span-1">
        <div className="px-4 sm:px-0">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-5 md:mt-0 md:col-span-2">
        <div className="shadow sm:rounded-md sm:overflow-hidden bg-white">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
