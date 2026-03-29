import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { obtenerNoticias, obtenerEventos, obtenerGaleria, obtenerProyectosFinalizados } from '../lib/supabase';
import NewsCard from '../components/NewsCard';
import EventItem from '../components/EventItem';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { 
  ArrowRight, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  FileText, 
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Cargamos cada sección de forma independiente para que si una falla, las demás sigan funcionando
      
      const loadNews = async () => {
        try {
          const data = await obtenerNoticias();
          setNoticias(data.slice(0, 3));
        } catch (err) {
          console.error("Error cargando noticias:", err);
        }
      };

      const loadEvents = async () => {
        try {
          const data = await obtenerEventos('proximo');
          setEventos(data.slice(0, 4));
        } catch (err) {
          console.error("Error cargando eventos:", err);
        }
      };

      const loadGallery = async () => {
        try {
          const data = await obtenerGaleria();
          setGaleria(data.slice(0, 6));
        } catch (err) {
          console.error("Error cargando galería:", err);
        }
      };

      const loadProjects = async () => {
        try {
          const data = await obtenerProyectosFinalizados();
          setProyectos(data);
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
      
      setLoading(false);
    }
    loadData();
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

      {/* Main Content Grid - 3 columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* News Feed */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <GlassCard className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                📢 Noticias Recientes
              </h2>
              <button className="text-[#059669] dark:text-green-400 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-card animate-pulse" />)
              ) : noticias.length > 0 ? (
                noticias.slice(0, 3).map((n) => (
                  <motion.div key={n.id} variants={itemVariants}>
                    <NewsCard noticia={n} />
                  </motion.div>
                ))
              ) : (
                <p className="text-foreground/40 italic px-4">No hay noticias recientes.</p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Events List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <GlassCard className="p-6 h-full">
            <div className="flex items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                📅 Próximos Eventos
              </h2>
            </div>

            <div className="space-y-2">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-card animate-pulse" />)
              ) : eventos.length > 0 ? (
                eventos.map((e) => (
                  <motion.div key={e.id} variants={itemVariants}>
                    <EventItem evento={e} />
                  </motion.div>
                ))
              ) : (
                <p className="text-foreground/40 italic text-center py-6">No hay eventos próximos.</p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Galería de Eventos */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <GlassCard className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                📸 Galería de Eventos
              </h2>
              <ImageIcon className="w-4 h-4 text-foreground/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {loading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />)
              ) : galeria.length > 0 ? (
                galeria.slice(0, 6).map((g, idx) => (
                  <motion.div 
                    key={g.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    viewport={{ once: true }}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-card-border"
                  >
                    <img src={g.imagen_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-center">
                      <p className="text-xs font-semibold text-white">{g.titulo || 'SISINFO'}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="col-span-full py-12 text-center text-foreground/40 italic bg-card rounded-2xl">La galería está vacía.</p>
              )}
            </div>

            {galeria.length > 0 && (
              <button className="mt-4 text-[#059669] dark:text-green-400 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all mx-auto">
                Ver todas las fotos <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}


