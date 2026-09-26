import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

const iconMap = {
  danger: <Trash2 className="w-6 h-6 text-red-600" />,
  warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
  info: <Info className="w-6 h-6 text-blue-600" />,
};

const bgMap = {
  danger: 'bg-red-50',
  warning: 'bg-amber-50',
  info: 'bg-blue-50',
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${bgMap[variant]} flex items-center justify-center`}>
          {iconMap[variant]}
        </div>
        <p className="text-sm text-gray-600 pt-2">{message}</p>
      </div>
    </Modal>
  );
}
