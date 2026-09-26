import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface Option {
  value: string | number;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  helperText?: string;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, helperText, className, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'block w-full rounded-input border-gray-300 shadow-sm focus-ring sm:text-sm',
            'border px-3 py-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500',
            error ? 'border-red-300 text-red-900 focus:ring-red-500' : 'focus:border-primary-500',
            className
          )}
          {...props}
        >
          <option value="" disabled>Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(error || helperText) && (
          <p className={cn('mt-1.5 text-sm', error ? 'text-red-600 animate-slide-in' : 'text-gray-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
export default SelectField;
