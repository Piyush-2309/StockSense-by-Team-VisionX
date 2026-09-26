import { cn } from '../../utils/cn';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error:   <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info:    <Info className="w-5 h-5 text-blue-500" />,
};

const borderMap = {
  success: 'border-l-green-500',
  error:   'border-l-red-500',
  warning: 'border-l-amber-500',
  info:    'border-l-blue-500',
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'bg-white rounded-lg shadow-lg border border-gray-200 border-l-4 p-4',
            'animate-slide-in pointer-events-auto',
            borderMap[toast.type]
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-gray-500">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
