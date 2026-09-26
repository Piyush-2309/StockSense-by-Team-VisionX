import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-input border-gray-300 shadow-sm focus-ring sm:text-sm',
            'border px-3 py-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500',
            error ? 'border-red-300 text-red-900 focus:ring-red-500' : 'focus:border-primary-500',
            className
          )}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('mt-1.5 text-sm', error ? 'text-red-600 animate-slide-in' : 'text-gray-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
export default TextField;
