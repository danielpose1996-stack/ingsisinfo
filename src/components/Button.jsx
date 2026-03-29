import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}) {
  const variants = {
    primary: 'bg-[#059669] hover:bg-[#047857] text-white',
    secondary: 'bg-[#1E3A8A] hover:bg-[#1E40AF] text-white',
    emerald: 'bg-[#059669] hover:bg-[#047857] text-white shadow-lg shadow-[#059669]/20',
    outline: 'border border-card-border hover:bg-card text-foreground',
    ghost: 'hover:bg-card text-foreground',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
