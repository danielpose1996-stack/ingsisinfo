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
    primary: 'bg-[#1E3A8A] hover:bg-[#1E40AF] text-white shadow-sm shadow-blue-900/5',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
    emerald: 'bg-[#1E3A8A] hover:bg-[#1E40AF] text-white shadow-sm shadow-blue-900/5',
    outline: 'border border-card-border hover:bg-slate-50 text-foreground',
    ghost: 'hover:bg-slate-50 text-foreground',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button
      className={cn(
        'font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
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
