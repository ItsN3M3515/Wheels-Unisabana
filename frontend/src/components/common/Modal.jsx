/**
 * Modal Component - Wheels UniSabana Design System
 * Confirmation dialogs and custom modals
 */
import { useEffect } from 'react';
import Button from './Button';

export default function Modal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  children,
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  loading = false,
  variant = 'default',
  size = 'md',
  showCancel = true,
}) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const variantStyles = {
    default: '',
    danger: 'border-error',
    warning: 'border-warning',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full p-6 animate-scale-in ${variantStyles[variant]}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-neutral-900 flex-1">
            {title}
          </h3>
          {!loading && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-neutral-100"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          {message && (
            <p className="text-neutral-600">
              {message}
            </p>
          )}
          {children}
        </div>

        {/* Actions */}
        {onConfirm && (
          <div className="flex gap-3">
            {showCancel && (
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                fullWidth
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation Modal - Shorthand for common confirmations
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      loading={loading}
      size="sm"
    />
  );
}
