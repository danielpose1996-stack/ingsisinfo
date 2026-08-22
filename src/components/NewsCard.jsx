import React from 'react';
import { Calendar, ChevronRight, ExternalLink } from 'lucide-react';

export default function NewsCard({ noticia, onClick }) {
  const { titulo, contenido, fecha, imagen_url, enlace_url } = noticia;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
  
  return (
    <div 
      onClick={onClick} 
      onKeyDown={handleKeyDown}
      tabIndex="0"
      aria-label={`Noticia: ${titulo}`}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]"
    >
      {/* Imagen de la noticia con fecha superpuesta */}
      <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center" aria-hidden="true">
          <span className="text-slate-400 text-3xl">📰</span>
        </div>
        {imagen_url && (
          <img 
            src={imagen_url} 
            alt={`Imagen de la noticia: ${titulo}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-0"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-xs text-white text-[11px] font-semibold z-10">
          <Calendar className="w-3.5 h-3.5 text-white/90" aria-hidden="true" />
          <span>{new Date(fecha).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Contenido textual */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-tight line-clamp-2 mb-2 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
          {titulo}
        </h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 flex-grow">
          {contenido}
        </p>

        <div className="pt-2 flex items-center justify-between mt-auto">
          <div className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
            <span>Leer más</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>

          {enlace_url && (
            <a
              href={enlace_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Leer artículo externo: ${titulo}`}
              className="text-xs text-slate-400 hover:text-[#1E3A8A] transition-colors p-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
