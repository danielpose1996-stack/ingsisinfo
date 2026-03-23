import React from 'react';
import GlassCard from './GlassCard';
import { Calendar } from 'lucide-react';

export default function NewsCard({ noticia }) {
  const { titulo, contenido, fecha, imagen_url } = noticia;
  
  return (
    <GlassCard hover className="flex flex-col h-full overflow-hidden p-0 group">
      <div className="relative h-48 overflow-hidden">
        {imagen_url ? (
          <img 
            src={imagen_url} 
            alt={titulo} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = ''; 
              e.target.parentElement.innerHTML = '<div class="w-full h-full bg-slate-800 flex items-center justify-center text-4xl">🖼️</div>';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-gray-600 text-4xl">📢</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent dark:from-black/80" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <Calendar className="w-3 h-3" />
          {new Date(fecha).toLocaleDateString()}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {titulo}
        </h3>
        <p className="text-foreground/60 text-sm line-clamp-3 leading-relaxed">
          {contenido}
        </p>
      </div>
    </GlassCard>
  );
}

