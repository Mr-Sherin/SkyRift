import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      glow = true,
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A1C] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 sm:px-5 py-2.5 text-xs sm:text-sm',
      lg: 'px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black',
    };

    const variantStyles = {
      primary: `bg-[#FF5A1F] hover:bg-[#E64C0E] text-white ${
        glow ? 'shadow-[0_0_20px_rgba(255,90,31,0.4),0_4px_12px_rgba(0,0,0,0.3)]' : ''
      } hover:shadow-[0_0_28px_rgba(255,90,31,0.6)]`,
      secondary:
        'bg-[#0A1228] hover:bg-[#101C3D] text-[#F1F5F9] border border-[rgba(148,163,184,0.2)] hover:border-[rgba(56,189,248,0.5)] shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
      ghost:
        'bg-transparent hover:bg-white/5 text-[#CBD5E1] hover:text-white border border-transparent hover:border-[rgba(148,163,184,0.2)]',
      danger: `bg-[#EF4444] hover:bg-[#DC2626] text-white ${
        glow ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''
      }`,
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

