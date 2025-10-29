/**
 * Card Component - Wheels UniSabana Design System
 * Reusable card container with consistent styling
 */
export default function Card({ 
  children, 
  className = '', 
  onClick,
  variant = 'default',
  padding = 'normal',
  hoverable = false,
}) {
  const baseClasses = 'bg-white rounded-xl border transition-all duration-300';
  
  const variants = {
    default: 'border-neutral-200 shadow-card',
    elevated: 'border-neutral-200 shadow-md',
    outlined: 'border-neutral-300 shadow-none',
    flat: 'border-transparent shadow-none bg-neutral-50',
  };
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  };
  
  const clickableClasses = (onClick || hoverable) 
    ? 'cursor-pointer hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.99]' 
    : '';
  
  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${paddings[padding]} ${clickableClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

