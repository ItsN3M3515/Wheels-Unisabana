import { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Review Form Component
 * For creating and editing reviews
 */
export default function ReviewForm({ 
  tripId, 
  existingReview = null, 
  onSubmit, 
  onCancel,
  loading = false 
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState(existingReview?.text || '');
  const [tags, setTags] = useState(existingReview?.tags || []);
  const [selectedTag, setSelectedTag] = useState('');

  const availableTags = ['Puntual', 'Seguro', 'Limpio', 'Comunicativo', 'Amable', 'Cómodo', 'Rápido', 'Económico'];

  const handleTagToggle = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else if (tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }
    onSubmit({ rating, text: text.trim(), tags });
  };

  const isLocked = existingReview && existingReview.lockedAt && new Date(existingReview.lockedAt) < new Date();

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Rating */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '12px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Calificación *
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: (isLocked || loading) ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                opacity: (isLocked || loading) ? 0.5 : 1
              }}
              disabled={isLocked || loading}
              onMouseEnter={(e) => {
                if (!isLocked && !loading) e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <Star
                style={{
                  width: '32px',
                  height: '32px',
                  fill: value <= (hoveredRating || rating) ? '#032567' : 'none',
                  color: value <= (hoveredRating || rating) ? '#032567' : '#d9d9d9',
                  transition: 'all 0.2s'
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '12px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Comentario (opcional)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Comparte tu experiencia..."
          maxLength={1000}
          rows={4}
          disabled={isLocked || loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            color: '#1c1917',
            backgroundColor: (isLocked || loading) ? '#f5f5f4' : 'white',
            border: '1px solid #e7e5e4',
            borderRadius: '12px',
            outline: 'none',
            transition: 'border-color 0.2s',
            cursor: (isLocked || loading) ? 'not-allowed' : 'text',
            resize: 'vertical'
          }}
          onFocus={(e) => {
            if (!isLocked && !loading) e.target.style.borderColor = '#032567';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e7e5e4';
          }}
        />
        <p style={{
          fontSize: '0.75rem',
          color: '#78716c',
          margin: '8px 0 0 0',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'right'
        }}>
          {text.length}/1000 caracteres
        </p>
      </div>

      {/* Tags */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '12px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Etiquetas (máximo 5)
        </label>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {availableTags.map((tag) => {
            const isSelected = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                disabled={isLocked || loading}
                style={{
                  padding: '6px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 'normal',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '20px',
                  border: `1px solid ${isSelected ? '#032567' : '#e7e5e4'}`,
                  backgroundColor: isSelected ? '#e0f2fe' : '#f5f5f4',
                  color: isSelected ? '#032567' : '#57534e',
                  cursor: (isLocked || loading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: (isLocked || loading) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLocked && !loading) {
                    e.target.style.backgroundColor = isSelected ? '#dbeafe' : '#e7e5e4';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = isSelected ? '#e0f2fe' : '#f5f5f4';
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {tags.length > 0 && (
          <p style={{
            fontSize: '0.75rem',
            color: '#78716c',
            margin: '12px 0 0 0',
            fontFamily: 'Inter, sans-serif'
          }}>
            Seleccionadas: {tags.join(', ')}
          </p>
        )}
      </div>

      {isLocked && (
        <div style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e7e5e4',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: '#57534e',
            margin: 0,
            fontFamily: 'Inter, sans-serif'
          }}>
            La ventana de edición ha expirado (24 horas después de crear la reseña)
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'normal',
              color: '#57534e',
              backgroundColor: 'white',
              border: '2px solid #d9d9d9',
              borderRadius: '25px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#f5f5f4';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = 'white';
            }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={rating === 0 || isLocked || loading}
          style={{
            flex: 1,
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 'normal',
            color: 'white',
            backgroundColor: (rating === 0 || isLocked || loading) ? '#94a3b8' : '#032567',
            border: 'none',
            borderRadius: '25px',
            cursor: (rating === 0 || isLocked || loading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            if (!(rating === 0 || isLocked || loading)) {
              e.target.style.backgroundColor = '#1A6EFF';
            }
          }}
          onMouseLeave={(e) => {
            if (!(rating === 0 || isLocked || loading)) {
              e.target.style.backgroundColor = '#032567';
            }
          }}
        >
          {loading ? 'Guardando...' : (existingReview ? 'Actualizar reseña' : 'Publicar reseña')}
        </button>
      </div>
    </form>
  );
}
