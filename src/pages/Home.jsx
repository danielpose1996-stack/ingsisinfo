import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { obtenerNoticias, obtenerEventos, obtenerGaleria, obtenerProyectosFinalizados, supabase } from '../lib/supabase';
import NewsCard from '../components/NewsCard';
import EventItem from '../components/EventItem';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { 
  ArrowRight, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  FileText, 
  ChevronRight,
  Calendar,
  ExternalLink,
  FileDown
} from 'lucide-react';

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Wait for Supabase auth to settle before fetching data.
    // On page refresh, the Supabase client restores the session from localStorage
    // which briefly puts the client in a transitional state where queries can fail.
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
          if (!cancelled) setGaleria(data.slice(0, 6));
        } catch (err) {
          console.error("Error cargando galería:", err);
        }
      };

      const loadProjects = async () => {
        try {
          const data = await obtenerProyectosFinalizados();
          if (!cancelled) setProyectos(data);
        } catch (err) {
          console.error("Error cargando proyectos:", err);
        }
      };

      await Promise.allSettled([
        loadNews(),
        loadEvents(),
        loadGallery(),
        loadProjects()
      ]);
      
      if (!cancelled) setLoading(false);
    }

    // Wait for the auth state to settle before querying.
    // This prevents the race condition where queries fire while
    // Supabase is still restoring the session from localStorage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // INITIAL_SESSION fires once when Supabase finishes restoring the session.
      // This is the safe moment to start querying.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchAllData();
      }
    });

    // Fallback: if INITIAL_SESSION doesn't fire within 1.5s, load anyway
    const fallbackTimer = setTimeout(() => {
      fetchAllData();
    }, 1500);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: "url('/hero-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60 z-[1]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" /> Programa de Ingeniería Informática
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white drop-shadow-lg">
            Semillero de Investigación <br />
            <span className="bg-gradient-to-r from-white via-[#93c5fd] to-[#6ee7b7] bg-clip-text text-transparent">
              SISINFO
            </span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Impulsando la innovación tecnológica y el desarrollo de soluciones informáticas en el Instituto Universitario de la Paz - UNIPAZ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/modulos'}
              className="px-8 py-4 rounded-xl bg-[#22d3ee] hover:bg-[#06b6d4] text-white font-bold transition-all transform hover:scale-105 shadow-lg shadow-[#22d3ee]/30"
            >
              Explorar Módulos
            </button>
            <button 
              onClick={() => window.location.href = '/informacion'}
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 transition-all backdrop-blur-sm"
            >
              Saber más
            </button>
          </div>
        </motion.div>

        {/* Decorative glow elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#1E3A8A]/20 rounded-full blur-3xl z-[2]" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-[#059669]/15 rounded-full blur-3xl z-[2]" />
      </section>

      {/* ═══ NOTICIAS RECIENTES ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Section Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#059669]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#059669]">Últimas Novedades</span>
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Noticias Recientes</h2>
            </div>
          </div>

          {/* News Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border border-card-border" />
              ))}
            </div>
          ) : noticias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <NewsCard noticia={n} onClick={() => setSelectedNews(n)} />
                </motion.div>
              ))}
            </div>
          ) : (
            <GlassCard className="p-12 text-center">
              <p className="text-foreground/40 italic">No hay noticias recientes.</p>
            </GlassCard>
          )}
        </motion.div>
      </section>

      {/* ═══ PRÓXIMOS EVENTOS + GALERÍA (2 columns) ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Events - 2 cols */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1E3A8A] dark:text-blue-400">Agenda</span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-8">Próximos Eventos</h2>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-card animate-pulse border border-card-border" />
                ))
              ) : eventos.length > 0 ? (
                eventos.map((e, idx) => {
                  const date = new Date(e.fecha_evento);
                  const day = date.getDate();
                  const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative flex gap-4 p-4 rounded-2xl border border-card-border bg-card/50 hover:bg-card hover:border-[#1E3A8A]/30 dark:hover:border-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#1E3A8A]/5 cursor-pointer"
                      onClick={() => setSelectedEvent(e)}
                    >
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] text-white flex-shrink-0 shadow-lg shadow-[#1E3A8A]/20">
                        <span className="text-2xl font-black leading-none">{day}</span>
                        <span className="text-[9px] font-bold tracking-widest opacity-80">{month}</span>
                      </div>

                      {/* Event Image */}
                      {e.imagen_url && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-card-border">
                          <img src={e.imagen_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <h4 className="text-foreground font-bold group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors truncate">
                          {e.titulo}
                        </h4>
                        {e.descripcion && (
                          <p className="text-foreground/40 text-xs mt-1 line-clamp-1">
                            {e.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <GlassCard className="p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-5 h-5 text-[#1E3A8A]/40 dark:text-blue-400/40" />
                  </div>
                  <p className="text-foreground/40 italic text-sm">No hay eventos próximos programados.</p>
                </GlassCard>
              )}
            </div>
          </motion.div>

          {/* Gallery - 3 cols */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Momentos</span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-8">Galería de Eventos</h2>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse border border-card-border" />
                ))}
              </div>
            ) : galeria.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galeria.slice(0, 6).map((g, idx) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-card-border shadow-lg shadow-black/5 dark:shadow-black/20 cursor-pointer"
                    onClick={() => setSelectedPhoto(g)}
                  >
                    <img
                      src={g.imagen_url}
                      alt={g.titulo || ''}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                      <p className="text-white text-sm font-bold truncate transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        {g.titulo || 'SISINFO'}
                      </p>
                      {g.eventos?.titulo && (
                        <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider mt-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                          {g.eventos.titulo}
                        </p>
                      )}
                    </div>
                    {/* Corner accent */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20">
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <GlassCard className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-5 h-5 text-amber-500/40" />
                </div>
                <p className="text-foreground/40 italic text-sm">La galería está vacía.</p>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══ MODAL DETALLE DE NOTICIA ═══ */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="Detalles de la Noticia"
        maxWidth="max-w-2xl"
      >
        {selectedNews && (
          <div className="space-y-6 animate-in fade-in">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-card border border-white/10 shadow-2xl">
              {selectedNews.imagen_url ? (
                <img
                  src={selectedNews.imagen_url}
                  alt={selectedNews.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-6xl">📢</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-[#059669] bg-[#059669]/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#059669]/30 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedNews.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight italic">
                {selectedNews.titulo}
              </h3>
              
              <div className="w-12 h-1 bg-[#059669] rounded-full" />
              
              <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap font-medium">
                {selectedNews.contenido}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
              {selectedNews.pdf_url && (
                <a
                  href={selectedNews.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-red-600/20 text-sm cursor-pointer"
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
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 transition-all text-sm backdrop-blur-sm"
                >
                  Leer Artículo Completo
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => setSelectedNews(null)}
                className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold transition-all text-sm border border-white/5 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ MODAL DETALLE DE EVENTO ═══ */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Detalles del Evento"
        maxWidth="max-w-2xl"
      >
        {selectedEvent && (
          <div className="space-y-6 animate-in fade-in">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-card border border-white/10 shadow-2xl">
              {selectedEvent.imagen_url ? (
                <img
                  src={selectedEvent.imagen_url}
                  alt={selectedEvent.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center">
                  <span className="text-6xl">📅</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-blue-500/30 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider italic">
                  {selectedEvent.tipo === 'proximo' ? 'Próximo Evento' : 'Evento Pasado'}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight italic">
                {selectedEvent.titulo}
              </h3>
              
              <div className="w-12 h-1 bg-blue-500 rounded-full" />
              
              <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap font-medium">
                {selectedEvent.descripcion || 'Sin descripción detallada.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold transition-all text-sm border border-white/5 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ MODAL DETALLE DE GALERÍA (LIGHTBOX) ═══ */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Galería de Momentos"
        maxWidth="max-w-3xl"
      >
        {selectedPhoto && (
          <div className="space-y-6 animate-in fade-in">
            <div className="relative max-h-[60vh] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl">
              <img
                src={selectedPhoto.imagen_url}
                alt={selectedPhoto.titulo || ''}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-lg font-bold text-white italic">
                {selectedPhoto.titulo || 'Fotografía de SISINFO'}
              </h4>
              {selectedPhoto.eventos?.titulo && (
                <div className="flex items-center gap-2 text-xs text-[#059669] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span>Evento vinculado: {selectedPhoto.eventos.titulo}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold transition-all text-sm border border-white/5 cursor-pointer"
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


