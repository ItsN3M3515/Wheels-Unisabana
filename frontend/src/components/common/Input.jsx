import React from 'react';

/**
 * Input Component - Wheels UniSabana Design System
 * Reusable text input with label and error message support
 */
const Input = React.forwardRef(({ 
  label, 
  error, 
  type = 'text',
  className = '',
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  ...props 
}, ref) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const inputClasses = `
    w-full
    ${sizes[size]}
    border rounded-lg
    ${error 
      ? 'border-error focus:ring-error focus:border-error' 
      : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'
    }
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
    placeholder:text-neutral-500
    transition-all duration-150
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-600">{helperText}</p>
      )}
      
      {error && (
        <p className="mt-1.5 text-sm text-error flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
