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
              "flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
              isActive 
                ? "bg-[#059669]/10 border-[#059669] text-[#059669] shadow-[0_0_20px_rgba(5,150,105,0.1)]" 
                : "bg-card border-card-border text-foreground/40 hover:bg-white/10"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive ? "text-[#059669]" : "text-foreground/40")} />
            <span className="text-sm font-bold tracking-wide uppercase italic">{role.name}</span>
          </button>
        );
      })}
    </div>
  );
}

