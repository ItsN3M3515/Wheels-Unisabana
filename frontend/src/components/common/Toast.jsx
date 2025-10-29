import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '24px',
      right: '24px',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '500px',
      zIndex: 9999,
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.95rem',
      animation: 'slideInRight 0.3s ease-out',
    };

    const typeStyles = {
      success: {
        backgroundColor: '#e0f2fe',
        border: '1px solid #bae6fd',
        color: '#032567',
      },
      error: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
      },
      info: {
        backgroundColor: '#e0f2fe',
        border: '1px solid #bae6fd',
        color: '#032567',
      },
      warning: {
        backgroundColor: '#fafafa',
        border: '1px solid #e7e5e4',
        color: '#57534e',
      },
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }
        `}
      </style>
      <div style={getStyles()}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: '500' }}>{message}</p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '0',
            opacity: 0.6,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.opacity = '1')}
          onMouseLeave={(e) => (e.target.style.opacity = '0.6')}
        >
          ×
        </button>
      </div>
    </>
  );
}

