import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { obtenerNoticias, obtenerEventos, obtenerGaleria, supabase } from '../lib/supabase';
import NewsCard from '../components/NewsCard';
import Modal from '../components/Modal';
import {
  FileText,
  Calendar,
  Image as ImageIcon,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  FileDown,
  Terminal
} from 'lucide-react';

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllData() {
      if (hasLoaded.current) return;
      hasLoaded.current = true;

      const loadNews = async () => {
        try {
          const data = await obtenerNoticias();
          if (!cancelled) setNoticias(data.slice(0, 3));
        } catch (err) {
          console.error("Error cargando noticias:", err);
        }
      };

      const loadEvents = async () => {
        try {
          const data = await obtenerEventos('proximo');
          if (!cancelled) setEventos(data.slice(0, 4));
        } catch (err) {
          console.error("Error cargando eventos:", err);
        }
      };

      const loadGallery = async () => {
        try {
          const data = await obtenerGaleria();
          if (!cancelled) setGaleria(data.slice(0, 3));
        } catch (err) {
          console.error("Error cargando galería:", err);
        }
      };

      await Promise.allSettled([
        loadNews(),
        loadEvents(),
        loadGallery()
      ]);

      if (!cancelled) setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchAllData();
      }
    });

    const fallbackTimer = setTimeout(() => {
      fetchAllData();
    }, 1500);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="space-y-20 pb-20 bg-background text-foreground">

      {/* ═══ 1. HERO PRINCIPAL ═══ */}
      <section 
        className="relative h-[78vh] min-h-[540px] flex items-center justify-center overflow-hidden"
        style={{ 
          backgroundImage: "url('/hero-bg.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat' 
        }}
      >
        {/* Capa de overlay azul oscuro elegante y uniforme para lectura óptima */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1E36]/90 via-[#0F1E36]/80 to-[#0F1E36]/90 z-0" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Badge lineal sobrio */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
            <Terminal className="w-3.5 h-3.5 text-blue-300" />
            <span>Programa de Ingeniería Informática</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-5 tracking-tight text-white leading-tight font-display drop-shadow-sm">
            Semillero de Investigación <br />
            <span className="text-white">
              SISINFO
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-white/85 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Impulsando la innovación tecnológica y el desarrollo de soluciones informáticas en el Instituto Universitario de la Paz – UNIPAZ.
          </p>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <button
              onClick={() => window.location.href = '/modulos'}
              className="px-8 py-3.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Explorar Módulos
            </button>
            <button
              onClick={() => window.location.href = '/informacion'}
              className="px-8 py-3.5 rounded-xl bg-black/30 hover:bg-white/10 text-white font-bold text-sm border border-white/30 backdrop-blur-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              Saber más
            </button>
          </div>
        </div>
      </section>

      {/* ═══ 2. NOTICIAS RECIENTES ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div>
          {/* Encabezado de Sección */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 text-[#15326C] dark:text-blue-400">
              <FileText className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Últimas Novedades</span>
            </div>
            <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Noticias Recientes
            </h2>
          </div>

          {/* Cuadrícula de Noticias */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-2xl bg-card animate-pulse border border-card-border" />
              ))}
            </div>
          ) : noticias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((n) => (
                <NewsCard key={n.id} noticia={n} onClick={() => setSelectedNews(n)} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-card rounded-2xl border border-card-border">
              <p className="text-foreground/50 text-sm">No hay noticias recientes registradas.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ 3. PRÓXIMOS EVENTOS & GALERÍA DE EVENTOS (2 COLUMNAS) ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Columna Izquierda: Próximos Eventos (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-2 text-[#15326C] dark:text-blue-400">
              <Calendar className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Agenda</span>
            </div>
            <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight mb-6">
              Próximos Eventos
            </h2>

            <div className="space-y-3.5">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-card animate-pulse border border-card-border" />
                ))
              ) : eventos.length > 0 ? (
                eventos.map((e) => {
                  const date = new Date(e.fecha_evento);
                  const day = date.getDate();
                  const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
                  return (
                    <div
                      key={e.id}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all duration-200 shadow-sm hover:shadow cursor-pointer"
                      onClick={() => setSelectedEvent(e)}
                    >
                      {/* Insignia de fecha */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-[#15326C] dark:text-blue-300 shrink-0">
                        <span className="text-xl font-black leading-none">{day}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5">{month}</span>
                      </div>

                      {/* Imagen pequeña si existe */}
                      {e.imagen_url && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                          <img src={e.imagen_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      )}

                      {/* Título & Detalle */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors truncate">
                          {e.titulo}
                        </h4>
                        {e.descripcion && (
                          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 line-clamp-1">
                            {e.descripcion}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors shrink-0" />
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-card rounded-2xl border border-card-border">
                  <p className="text-foreground/50 text-xs">No hay eventos próximos programados.</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Galería de Eventos (7 cols) */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-2 text-[#15326C] dark:text-blue-400">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Momentos</span>
            </div>
            <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight mb-6">
              Galería de Eventos
            </h2>

            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse border border-card-border" />
                ))}
              </div>
            ) : galeria.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {galeria.map((g) => (
                    <div
                      key={g.id}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
                      onClick={() => setSelectedPhoto(g)}
                    >
                      <img
                        src={g.imagen_url}
                        alt={g.titulo || 'SISINFO'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Overlay sutil al hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
                        <p className="text-white text-xs font-bold truncate">
                          {g.titulo || 'SISINFO'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enlace ver más fotos */}
                <div className="mt-5">
                  <button
                    onClick={() => window.location.href = '/informacion'}
                    className="text-xs font-bold text-[#15326C] dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all cursor-pointer"
                  >
                    <span>Ver más fotos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-card rounded-2xl border border-card-border">
                <p className="text-foreground/50 text-xs">No hay fotografías en la galería.</p>
              </div>
            )}
          </div>

        </div>
      </section>



      {/* ═══ MODALES (DETALLE NOTICIA, EVENTO, FOTO) ═══ */}
      {/* Modal Noticia */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="Detalles de la Noticia"
        maxWidth="max-w-2xl"
      >
        {selectedNews && (
          <div className="space-y-6">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
              {selectedNews.imagen_url ? (
                <img
                  src={selectedNews.imagen_url}
                  alt={selectedNews.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">
                  📢
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-white bg-black/50 backdrop-blur-xs px-3 py-1.5 rounded-full font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedNews.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                {selectedNews.titulo}
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedNews.contenido}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {selectedNews.pdf_url && (
                <a
                  href={selectedNews.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <FileDown className="w-4 h-4" />
                  Descargar PDF Adjunto
                </a>
              )}
              {selectedNews.enlace_url && (
                <a
                  href={selectedNews.enlace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
                >
                  <span>Leer Artículo Completo</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => setSelectedNews(null)}
                className="px-5 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Evento */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Detalles del Evento"
        maxWidth="max-w-2xl"
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
              {selectedEvent.imagen_url ? (
                <img
                  src={selectedEvent.imagen_url}
                  alt={selectedEvent.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">
                  📅
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-white bg-black/50 backdrop-blur-xs px-3 py-1.5 rounded-full font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                {selectedEvent.titulo}
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedEvent.descripcion || 'Sin descripción detallada.'}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Foto Galería */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Fotografía SISINFO"
        maxWidth="max-w-3xl"
      >
        {selectedPhoto && (
          <div className="space-y-6">
            <div className="relative max-h-[60vh] w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
              <img
                src={selectedPhoto.imagen_url}
                alt={selectedPhoto.titulo || ''}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
              <h4 className="text-base font-bold text-[#0F172A] dark:text-white">
                {selectedPhoto.titulo || 'Fotografía de SISINFO'}
              </h4>
              {selectedPhoto.eventos?.titulo && (
                <p className="text-xs text-[#15326C] dark:text-blue-400 font-semibold">
                  Evento vinculado: {selectedPhoto.eventos.titulo}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 cursor-pointer"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
