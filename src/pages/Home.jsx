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
    <div className="space-y-24 pb-24 bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: "url('/hero-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 z-[1]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-blue-300" /> Programa de Ingeniería Informática
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white drop-shadow-lg">
            Semillero de Investigación <br />
            <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              SISINFO
            </span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Impulsando la innovación tecnológica y el desarrollo de soluciones informáticas en el Instituto Universitario de la Paz - UNIPAZ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/modulos'}
              className="px-8 py-4 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-bold transition-all shadow-md shadow-blue-900/10"
            >
              Explorar Módulos
            </button>
            <button
              onClick={() => window.location.href = '/informacion'}
              className="px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 transition-all backdrop-blur-xs"
            >
              Saber más
            </button>
          </div>
        </motion.div>

        {/* Decorative glow elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#1E3A8A]/10 rounded-full blur-3xl z-[2]" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-[#1E3A8A]/10 rounded-full blur-3xl z-[2]" />
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
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Últimas Novedades</span>
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Noticias Recientes</h2>
            </div>
          </div>

          {/* News Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 rounded-xl bg-card animate-pulse border border-card-border" />
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
            <GlassCard className="p-12 text-center bg-card">
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
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Agenda</span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-8">Próximos Eventos</h2>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-xl bg-card animate-pulse border border-card-border" />
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
                      className="group relative flex gap-4 p-4 rounded-xl border border-card-border bg-card hover:bg-slate-50 hover:border-primary/30 transition-all duration-300 hover:shadow-sm cursor-pointer"
                      onClick={() => setSelectedEvent(e)}
                    >
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-blue-50 border border-blue-200/60 text-[#1E3A8A] flex-shrink-0">
                        <span className="text-2xl font-bold leading-none">{day}</span>
                        <span className="text-[9px] font-bold tracking-widest opacity-80">{month}</span>
                      </div>

                      {/* Event Image */}
                      {e.imagen_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-card-border">
                          <img src={e.imagen_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <h4 className="text-foreground font-bold group-hover:text-primary transition-colors truncate">
                          {e.titulo}
                        </h4>
                        {e.descripcion && (
                          <p className="text-foreground/60 text-xs mt-1 line-clamp-1">
                            {e.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-primary" />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <GlassCard className="p-10 text-center bg-card">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-5 h-5 text-primary/60" />
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
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Momentos</span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-8">Galería de Eventos</h2>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square rounded-xl bg-card animate-pulse border border-card-border" />
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
                    className="group relative aspect-square rounded-xl overflow-hidden border border-card-border shadow-sm cursor-pointer"
                    onClick={() => setSelectedPhoto(g)}
                  >
                    <img
                      src={g.imagen_url}
                      alt={g.titulo || ''}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                      <p className="text-white text-sm font-bold truncate transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        {g.titulo || 'SISINFO'}
                      </p>
                      {g.eventos?.titulo && (
                        <p className="text-white/75 text-[10px] font-medium uppercase tracking-wider mt-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                          {g.eventos.titulo}
                        </p>
                      )}
                    </div>
                    {/* Corner accent */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20">
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <GlassCard className="p-16 text-center bg-card">
                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-foreground/40 italic text-sm">La galería está vacía.</p>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══ PRÓXIMOS PROYECTOS FINALIZADOS ═══ */}
      {proyectos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FileDown className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Logros</span>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-8">Proyectos Finalizados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl border border-card-border bg-card shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
              >
                <Badge variant="blue" className="w-fit mb-4">{p.categoria || 'Proyecto'}</Badge>
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">{p.titulo}</h3>
                <p className="text-foreground/75 text-sm line-clamp-3 leading-relaxed flex-grow">{p.descripcion}</p>
                {p.documento_url && (
                  <a
                    href={p.documento_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ver Documentación</span>
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ MODAL DETALLE DE NOTICIA ═══ */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="Detalles de la Noticia"
        maxWidth="max-w-2xl"
      >
        {selectedNews && (
          <div className="space-y-6 animate-in fade-in">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-card-border shadow-md">
              {selectedNews.imagen_url ? (
                <img
                  src={selectedNews.imagen_url}
                  alt={selectedNews.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <span className="text-6xl">📢</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-primary bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedNews.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight italic">
                {selectedNews.titulo}
              </h3>

              <div className="w-12 h-1 bg-primary rounded-full" />

              <p className="text-foreground/85 text-base leading-relaxed whitespace-pre-wrap font-medium">
                {selectedNews.contenido}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-card-border">
              {selectedNews.pdf_url && (
                <a
                  href={selectedNews.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-sm text-sm cursor-pointer"
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
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition-all text-sm"
                >
                  Leer Artículo Completo
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => setSelectedNews(null)}
                className="px-6 py-4 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold transition-all text-sm border border-slate-200 cursor-pointer"
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
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-card-border shadow-md">
              {selectedEvent.imagen_url ? (
                <img
                  src={selectedEvent.imagen_url}
                  alt={selectedEvent.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <span className="text-6xl">📅</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-primary bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-[10px] font-black uppercase tracking-wider italic">
                  {selectedEvent.tipo === 'proximo' ? 'Próximo Evento' : 'Evento Pasado'}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight italic">
                {selectedEvent.titulo}
              </h3>

              <div className="w-12 h-1 bg-primary rounded-full" />

              <p className="text-foreground/85 text-base leading-relaxed whitespace-pre-wrap font-medium">
                {selectedEvent.descripcion || 'Sin descripción detallada.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-card-border">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-4 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold transition-all text-sm border border-slate-200 cursor-pointer"
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
            <div className="relative max-h-[60vh] w-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-card-border shadow-md">
              <img
                src={selectedPhoto.imagen_url}
                alt={selectedPhoto.titulo || ''}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-lg font-bold text-foreground italic">
                {selectedPhoto.titulo || 'Fotografía de SISINFO'}
              </h4>
              {selectedPhoto.eventos?.titulo && (
                <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Evento vinculado: {selectedPhoto.eventos.titulo}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-6 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold transition-all text-sm border border-slate-200 cursor-pointer"
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
