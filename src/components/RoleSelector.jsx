import React from 'react';
import { User, GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function RoleSelector({ selectedRole, onRoleChange }) {
  const roles = [
    { id: 'estudiante', name: 'Estudiante', icon: GraduationCap },
    { id: 'docente', name: 'Docente', icon: User },
  ];

  return (
    <div className="flex gap-4 mb-8">
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = selectedRole === role.id;
        
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onRoleChange(role.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300",
              isActive 
                ? "bg-blue-50 border-primary text-primary shadow-sm shadow-blue-900/5" 
                : "bg-card border-card-border text-foreground/60 hover:bg-slate-50 hover:text-foreground/80"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-slate-400")} />
            <span className="text-xs font-bold tracking-wide uppercase">{role.name}</span>
          </button>
        );
      })}
    </div>
  );
}

