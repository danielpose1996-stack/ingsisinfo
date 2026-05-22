import React from 'react';
import GlassCard from './GlassCard';
import { Calendar, ExternalLink } from 'lucide-react';

export default function NewsCard({ noticia, onClick }) {
  const { titulo, contenido, fecha, imagen_url, enlace_url } = noticia;
  
  return (
    <GlassCard hover onClick={onClick} className="flex flex-col h-full overflow-hidden p-0 group cursor-pointer hover:shadow-md transition-all duration-300 border border-card-border hover:border-primary/30">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {imagen_url ? (
          <img 
            src={imagen_url} 
            alt={titulo} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = ''; 
              e.target.parentElement.innerHTML = '<div class="w-full h-full bg-slate-100 flex items-center justify-center text-4xl">🖼️</div>';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-slate-400 text-4xl">📢</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-white/90 font-medium">
          <Calendar className="w-3.5 h-3.5 text-white/95" />
          {new Date(fecha).toLocaleDateString()}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow bg-card">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {titulo}
        </h3>
        <p className="text-foreground/75 text-sm line-clamp-3 leading-relaxed flex-grow">
          {contenido}
        </p>
        {enlace_url && (
          <a
            href={enlace_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors group/link"
          >
            <span>Leer artículo</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </a>
        )}
      </div>
    </GlassCard>
  );
}
