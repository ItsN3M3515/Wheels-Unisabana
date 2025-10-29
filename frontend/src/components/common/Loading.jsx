/**
 * Loading Component - Wheels UniSabana Design System
 * Loading indicators for different use cases
 */

/**
 * Spinner component
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <svg
      className={`animate-spin text-primary-600 ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({ message = 'Cargando...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center animate-fade-in-up">
        <Spinner size="xl" />
        <p className="mt-4 text-neutral-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * Inline loading state
 */
export function LoadingInline({ message = 'Cargando...',  size = 'md' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Spinner size={size} className="mx-auto" />
        <p className="mt-3 text-neutral-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for cards
 */
export function LoadingSkeleton({ count = 3, type = 'card' }) {
  const skeletons = {
    card: (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
      </div>
    ),
    list: (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-neutral-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletons[type]}</div>
      ))}
    </div>
  );
}

/**
 * Default export - basic spinner
 */
export default function Loading({ size = 'md' }) {
  return <Spinner size={size} />;
}

