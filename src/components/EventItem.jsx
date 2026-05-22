import React from 'react';
import { CalendarDays } from 'lucide-react';

export default function EventItem({ evento }) {
  const { titulo, fecha_evento, descripcion, imagen_url } = evento;
  const date = new Date(fecha_evento);
  const day = date.getDate();
  const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();

  return (
    <div className="flex gap-4 p-4 rounded-xl hover:bg-card transition-colors border border-transparent hover:border-card-border group bg-card/40">
      <div className="flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-lg bg-blue-50 text-[#1E3A8A] border border-blue-200/60">
        <span className="text-xl font-bold leading-none">{day}</span>
        <span className="text-[10px] font-bold tracking-wider">{month}</span>
      </div>
      
      {imagen_url && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-card-border">
          <img src={imagen_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        </div>
      )}

      <div className="flex flex-col justify-center">
        <h4 className="text-foreground font-semibold group-hover:text-primary transition-colors">
          {titulo}
        </h4>
        {descripcion && (
          <p className="text-foreground/60 text-xs mt-1 line-clamp-1">
            {descripcion}
          </p>
        )}
      </div>
    </div>
  );
}

