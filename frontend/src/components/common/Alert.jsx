/**
 * Alert Component - Wheels UniSabana Design System
 * Display contextual feedback messages
 */
export default function Alert({ 
  type = 'info', 
  message, 
  title,
  onClose,
  action,
  className = '',
}) {
  if (!message) return null;

  const types = {
    success: {
      container: 'bg-success-light border-success',
      icon: 'text-success-dark',
      text: 'text-success-dark',
      title: 'text-success-dark',
      button: 'text-success-dark hover:bg-success/10',
      svgIcon: (
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      container: 'bg-error-light border-error',
      icon: 'text-error-dark',
      text: 'text-error-dark',
      title: 'text-error-dark',
      button: 'text-error-dark hover:bg-error/10',
      svgIcon: (
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      container: 'bg-warning-light border-warning',
      icon: 'text-warning-dark',
      text: 'text-warning-dark',
      title: 'text-warning-dark',
      button: 'text-warning-dark hover:bg-warning/10',
      svgIcon: (
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      container: 'bg-info-light border-info',
      icon: 'text-info-dark',
      text: 'text-info-dark',
      title: 'text-info-dark',
      button: 'text-info-dark hover:bg-info/10',
      svgIcon: (
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = types[type];

  return (
    <div className={`${config.container} border rounded-xl p-4 shadow-sm animate-fade-in-up ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.icon}`}>
          {config.svgIcon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold ${config.title} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${config.text}`}>
            {message}
          </p>
          
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={`text-sm font-medium ${config.text} hover:underline`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.button} rounded-lg p-1.5 transition-colors`}
            aria-label="Cerrar alerta"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
