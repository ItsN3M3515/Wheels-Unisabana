import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { changePassword } from '../../api/auth';

export default function ChangePassword({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, watch, setError: setFieldError } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccess('Contraseña cambiada exitosamente');
      reset(); // Clear form
      
      // Call onSuccess callback after a short delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      // Show errors on specific fields
      if (err.code === 'invalid_credentials') {
        setFieldError('currentPassword', {
          type: 'manual',
          message: 'La contraseña actual es incorrecta'
        });
      } else if (err.code === 'invalid_schema') {
        setFieldError('newPassword', {
          type: 'manual',
          message: 'La nueva contraseña no cumple con los requisitos de seguridad'
        });
      } else if (err.code === 'network_error') {
        setError(err.message);
      } else {
        setError(err.message || 'Error al cambiar la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Alerts */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <p style={{ color: '#991b1b', fontSize: '13px', margin: 0, flex: 1 }}>
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '0',
              fontSize: '16px',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <span style={{ color: '#16a34a', fontSize: '18px' }}>✓</span>
          <p style={{ color: '#15803d', fontSize: '13px', margin: 0, flex: 1 }}>
            {success}
          </p>
          <button
            onClick={() => setSuccess(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#15803d',
              cursor: 'pointer',
              padding: '0',
              fontSize: '16px',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '500',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Contraseña actual
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('currentPassword', {
                required: 'La contraseña actual es requerida',
              })}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: errors.currentPassword ? '2px solid #dc2626' : '2px solid transparent',
                borderRadius: '25px',
                backgroundColor: '#d9d9d9',
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            {errors.currentPassword && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '500',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Nueva contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('newPassword', {
                required: 'La nueva contraseña es requerida',
                minLength: {
                  value: 8,
                  message: 'Mínimo 8 caracteres',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-+=<>,.;:'"`~#^()[\]{}|/\\])[A-Za-z\d@$!%*?&_\-+=<>,.;:'"`~#^()[\]{}|/\\]{8,}$/,
                  message: 'Debe contener mayúsculas, minúsculas, números y caracteres especiales',
                },
              })}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: errors.newPassword ? '2px solid #dc2626' : '2px solid transparent',
                borderRadius: '25px',
                backgroundColor: '#d9d9d9',
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            {errors.newPassword && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '500',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Confirma tu nueva contraseña',
                validate: (value) =>
                  value === newPassword || 'Las contraseñas no coinciden',
              })}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: errors.confirmPassword ? '2px solid #dc2626' : '2px solid transparent',
                borderRadius: '25px',
                backgroundColor: '#d9d9d9',
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            {errors.confirmPassword && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Password requirements */}
          <div style={{
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0f2fe'
          }}>
            <p style={{
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#1c1917',
              margin: '0 0 8px 0',
              fontFamily: 'Inter, sans-serif'
            }}>
              Requisitos de la contraseña:
            </p>
            <ul style={{
              fontSize: '0.85rem',
              color: '#57534e',
              margin: 0,
              paddingLeft: '20px',
              fontFamily: 'Inter, sans-serif'
            }}>
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra mayúscula</li>
              <li>Al menos una letra minúscula</li>
              <li>Al menos un número</li>
              <li>Al menos un carácter especial (@$!%*?&_-+=&lt;&gt;,.;:'"`~#^()[]{}|/\)</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem 1.25rem',
              fontSize: '1.1rem',
              fontWeight: 'normal',
              color: 'white',
              backgroundColor: loading ? '#94a3b8' : '#032567',
              border: 'none',
              borderRadius: '25px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#1A6EFF';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#032567';
            }}
          >
            {loading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
