import { useState } from 'react';

const REPORT_CATEGORIES = [
  { value: 'abuse', label: 'Abuso' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'fraud', label: 'Fraude' },
  { value: 'no_show', label: 'No se presentó' },
  { value: 'unsafe_behavior', label: 'Comportamiento inseguro' },
  { value: 'other', label: 'Otro' }
];

export default function ReportUserModal({ 
  userId, 
  userName, 
  tripId,
  onClose, 
  onReported 
}) {
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!category) {
      setError('Por favor selecciona una categoría');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { reportUser } = await import('../../api/user');
      await reportUser(userId, { tripId, category, reason: reason.trim() || undefined });
      
      if (onReported) {
        onReported();
      }
      
      onClose();
    } catch (err) {
      console.error('Error reporting user:', err);
      setError(err.message || 'Error al reportar al usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '500px',
        width: '100%',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1c1917',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            flex: 1
          }}>
            Reportar a {userName}
          </h3>
          {!loading && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#57534e',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                fontSize: '20px',
                lineHeight: '1'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ×
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#991b1b', fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Category */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Categoría del reporte *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '1rem',
                  color: '#1c1917',
                  backgroundColor: 'white',
                  fontFamily: 'Inter, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#032567'}
                onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
              >
                <option value="">Selecciona una categoría</option>
                {REPORT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Razón (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                maxLength={500}
                rows={4}
                placeholder="Describe el motivo del reporte..."
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '1rem',
                  color: '#1c1917',
                  backgroundColor: 'white',
                  fontFamily: 'Inter, sans-serif',
                  cursor: loading ? 'not-allowed' : 'text',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'vertical',
                  minHeight: '100px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#032567'}
                onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#78716c',
                margin: '4px 0 0 0',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'right'
              }}>
                {reason.length}/500
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#032567',
                  backgroundColor: 'white',
                  border: '2px solid #032567',
                  borderRadius: '25px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.backgroundColor = 'white';
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !category}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: loading || !category ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  opacity: loading || !category ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!loading && category) e.target.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  if (!loading && category) e.target.style.backgroundColor = '#dc2626';
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  'Reportar'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

