import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function GlassCard({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'glass-effect rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-black/20',
        hover && 'hover:bg-primary/5 hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
