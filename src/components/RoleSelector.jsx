import React from 'react';
import { User, GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function RoleSelector({ selectedRole, onRoleChange }) {
  const roles = [
    { id: 'estudiante', name: 'Estudiante', icon: GraduationCap },
    { id: 'docente', name: 'Docente', icon: User },
  ];

  return (
    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-card-border mb-8 relative" role="tablist" aria-label="Selección de Rol de Usuario">
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = selectedRole === role.id;
        
        return (
          <button
            key={role.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${role.id}`}
            id={`tab-${role.id}`}
            onClick={() => onRoleChange(role.id)}
            className={cn(
              "flex-grow flex flex-col items-center gap-2 py-3 px-4 rounded-xl border transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 relative z-10 cursor-pointer",
              isActive 
                ? "text-primary border-transparent" 
                : "text-foreground/50 border-transparent hover:text-foreground/80"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeRoleIndicator"
                className="absolute inset-0 bg-white border border-primary/10 shadow-sm rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "text-primary scale-110" : "text-slate-400")} aria-hidden="true" />
            <span className="text-[10px] font-black tracking-widest uppercase font-display">{role.name}</span>
          </button>
        );
      })}
    </div>
  );
}

