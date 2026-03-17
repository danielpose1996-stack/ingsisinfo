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
      try {
        const [news, evs, gal, proys] = await Promise.all([
          obtenerNoticias(),
          obtenerEventos('proximo'),
          obtenerGaleria(),
          obtenerProyectosFinalizados()
        ]);
        setNoticias(news.slice(0, 3));
        setEventos(evs.slice(0, 4));
        setGaleria(gal.slice(0, 6));
        setProyectos(proys);
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
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
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent opacity-50" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Programa de Ingeniería Informática
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-foreground">
            Semillero de Investigación <br />
            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              SISINFO
            </span>
          </h1>
          <p className="text-foreground/60 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Potenciando la innovación y el descubrimiento científico en el Instituto Universitario de la Paz - UNIPAZ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20">
              Explorar Módulos
            </button>
            <button 
              onClick={() => window.location.href = '/informacion'}
              className="px-8 py-4 rounded-xl bg-card hover:bg-card/80 text-foreground font-bold border border-card-border transition-all backdrop-blur-sm"
            >
              Saber más
            </button>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* News Feed */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="flex items-center justify-between border-b border-card-border pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
              <span className="w-2 h-8 bg-emerald-500 rounded-full" />
              📢 Noticias Recientes
            </h2>
            <button className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />)
            ) : noticias.length > 0 ? (
              noticias.map((n) => (
                <motion.div key={n.id} variants={itemVariants}>
                  <NewsCard noticia={n} />
                </motion.div>
              ))
            ) : (
              <p className="text-foreground/40 italic px-4">No hay noticias recientes.</p>
            )}
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="flex items-center border-b border-card-border pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
              <span className="w-2 h-8 bg-blue-500 rounded-full" />
              📅 Eventos
            </h2>
          </div>

          <GlassCard className="p-2 space-y-1">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-card animate-pulse m-2" />)
            ) : eventos.length > 0 ? (
              eventos.map((e) => (
                <motion.div key={e.id} variants={itemVariants}>
                  <EventItem evento={e} />
                </motion.div>
              ))
            ) : (
              <p className="p-6 text-foreground/40 italic text-center">No hay eventos próximos.</p>
            )}
          </GlassCard>
        </motion.div>
      </div>



        {/* Galería Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between border-b border-card-border pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
            <span className="w-2 h-8 bg-amber-500 rounded-full" />
            📸 Galería de Eventos
          </h2>
          <ImageIcon className="text-foreground/20" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />)
          ) : galeria.length > 0 ? (
            galeria.map((g, idx) => (
              <motion.div 
                key={g.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="group relative aspect-square rounded-xl overflow-hidden border border-card-border"
              >
                <img src={g.imagen_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                  <p className="text-xs font-semibold text-foreground">{g.titulo || 'SISINFO'}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-foreground/40 italic bg-card rounded-2xl">La galería está vacía.</p>
          )}
        </div>
      </section>
    </div>
  );
}


