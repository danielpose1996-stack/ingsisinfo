import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function GlassCard({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'glass-effect rounded-2xl p-6 transition-all duration-300 ease-out',
        hover && 'hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-primary/20 hover:bg-white/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
