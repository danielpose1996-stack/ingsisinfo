import React from 'react';
import GlassCard from './GlassCard';
import { Calendar, ExternalLink } from 'lucide-react';

export default function NewsCard({ noticia, onClick }) {
  const { titulo, contenido, fecha, imagen_url, enlace_url } = noticia;
  
  return (
    <GlassCard hover onClick={onClick} className="flex flex-col h-full overflow-hidden p-0 group cursor-pointer hover:shadow-lg hover:shadow-[#059669]/5 transition-all duration-300 border border-transparent hover:border-[#059669]/20">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-[#059669] font-medium">
          <Calendar className="w-3 h-3" />
          {new Date(fecha).toLocaleDateString()}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-[#059669] transition-colors">
          {titulo}
        </h3>
        <p className="text-foreground/60 text-sm line-clamp-3 leading-relaxed flex-grow">
          {contenido}
        </p>
        {enlace_url && (
          <a
            href={enlace_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors group/link"
          >
            <span>Leer artículo</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </a>
        )}
      </div>
    </GlassCard>
  );
}
