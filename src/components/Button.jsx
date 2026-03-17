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
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-black',
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20',
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
