/**
 * Empty State Component - Wheels UniSabana Design System
 * Display empty states with icons and actions
 */
import Button from './Button';
import Card from './Card';

export default function Empty({
  icon = '',
  title = 'No hay datos',
  description,
  action,
  variant = 'default',
  className = '',
}) {
  const content = (
    <div className={`text-center py-12 ${className}`}>
      {icon && <div className="text-6xl mb-4 animate-fade-in">{icon}</div>}
      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return <Card>{content}</Card>;
  }

  return content;
}

/**
 * Predefined empty states
 */
export function EmptyTrips({ onCreateTrip, isDriver = false }) {
  return (
    <Empty
      icon=""
      title={isDriver ? 'No tienes viajes' : 'No hay viajes disponibles'}
      description={
        isDriver
          ? 'Comienza a ofrecer viajes para conectar con otros estudiantes'
          : 'Aún no hay viajes publicados. Vuelve más tarde'
      }
      action={
        isDriver
          ? {
              label: 'Ofrecer mi primer viaje',
              onClick: onCreateTrip,
            }
          : undefined
      }
      variant="card"
    />
  );
}

export function EmptySearch({ onClearFilters }) {
  return (
    <Empty
      icon=""
      title="No se encontraron resultados"
      description="Intenta ajustar tus filtros de búsqueda"
      action={{
        label: 'Limpiar filtros',
        onClick: onClearFilters,
        variant: 'secondary',
      }}
      variant="card"
    />
  );
}

export function EmptyBookings({ onSearchTrips }) {
  return (
    <Empty
      icon=""
      title="No tienes reservas"
      description="Busca viajes disponibles y solicita tu lugar"
      action={{
        label: 'Buscar viajes',
        onClick: onSearchTrips,
      }}
      variant="card"
    />
  );
}

export function EmptyNotifications() {
  return (
    <Empty
      icon=""
      title="No hay notificaciones"
      description="Te notificaremos cuando haya novedades"
      variant="card"
    />
  );
}

