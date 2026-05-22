import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function Badge({ children, variant = 'gray', className }) {
  const variants = {
    emerald: 'bg-blue-50 text-[#1E3A8A] border-blue-200/60',
    blue: 'bg-blue-50 text-blue-800 border-blue-200/60',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/60',
    red: 'bg-red-50 text-red-800 border-red-200/60',
    gray: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
