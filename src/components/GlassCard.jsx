import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function GlassCard({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-card-border p-6 transition-all duration-300 shadow-sm',
        hover && 'hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.01]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
