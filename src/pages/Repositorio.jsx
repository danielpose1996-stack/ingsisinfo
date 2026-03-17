import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { obtenerProyectosFinalizados } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Download, FileText, Search, Filter, BookOpen, User as UserIcon, Calendar } from 'lucide-react';

export default function Repositorio() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLinea, setFilterLinea] = useState('');
  const [searchNombre, setSearchNombre] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const proys = await obtenerProyectosFinalizados();
        setProyectos(proys);
      } catch (error) {
        console.error("Error loading repository data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProyectos = proyectos
    .filter(p => !filterLinea || p.linea_investigacion === filterLinea)
    .filter(p => !searchNombre || 
      `${p.estudiante?.nombre} ${p.estudiante?.apellido}`.toLowerCase().includes(searchNombre.toLowerCase()) ||
      p.nombre.toLowerCase().includes(searchNombre.toLowerCase())
    );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 bg-card rounded-xl ml-auto mr-auto md:ml-0 md:mr-0" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header Section */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-emerald-500" />
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest italic font-mono">Archivo Histórico</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground italic tracking-tighter">
              REPOSITORIO DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">PROYECTOS</span>
            </h1>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="p-6 border-card-border bg-white/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Buscar por estudiante o título..."
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                className="w-full bg-black/20 border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm text-foreground focus:border-emerald-500 outline-none transition-all italic"
              />
            </div>

            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select 
                className="w-full bg-black/20 border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm text-foreground focus:border-emerald-500 outline-none transition-all italic appearance-none"
                value={filterLinea}
                onChange={(e) => setFilterLinea(e.target.value)}
              >
                <option value="">Todas las Líneas</option>
                <option value="Ingeniería de Software">Ingeniería de Software</option>
                <option value="Robótica">Robótica</option>
                <option value="Ingeniería del Conocimiento">Ingeniería del Conocimiento</option>
                <option value="Redes y Telemática">Redes y Telemática</option>
                <option value="Gestión de la Seguridad Informática">Gestión de la Seguridad Informática</option>
              </select>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-2 text-gray-500 text-xs italic font-medium uppercase tracking-widest">
              <Filter className="w-3 h-3" /> {filteredProyectos.length} Proyectos encontrados
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Grid Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProyectos.length > 0 ? (
            filteredProyectos.map((p, idx) => (
              <motion.div 
                key={p.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <GlassCard className="group h-full flex flex-col border-emerald-500/5 hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5">
                  <div className="p-8 flex-grow">
                    <div className="flex justify-between items-start mb-6">
                      <Badge variant="emerald" className="px-3 py-1 text-[10px] tracking-widest">PRODUCTO FINAL</Badge>
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-6 italic group-hover:text-emerald-400 transition-colors leading-tight">
                      {p.nombre}
                    </h3>

                    <div className="space-y-4 pt-6 border-t border-card-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Autor</p>
                          <p className="text-sm text-gray-200 font-medium">{p.estudiante?.nombre} {p.estudiante?.apellido}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Línea</p>
                          <p className="text-sm text-gray-200 font-medium italic">{p.linea_investigacion}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Fecha de Publicación</p>
                          <p className="text-sm text-gray-200 font-medium">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card border-t border-card-border">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 italic text-xs py-4 group-hover:bg-emerald-500 group-hover:text-black transition-all"
                      onClick={() => {
                        const lastVersion = p.versiones_proyecto?.[p.versiones_proyecto.length - 1];
                        if (lastVersion?.documento_url) {
                          window.open(lastVersion.documento_url, '_blank');
                        }
                      }}
                    >
                      <Download className="w-4 h-4" /> REVISAR DOCUMENTACIÓN
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center bg-white/[0.02] rounded-3xl border border-card-border border-dashed"
            >
              <div className="flex justify-center mb-4">
                <Search className="w-12 h-12 text-gray-600 opacity-20" />
              </div>
              <p className="text-gray-500 italic text-lg">No se encontraron proyectos en el archivo histórico.</p>
              <p className="text-gray-600 text-sm mt-2">Intenta ajustar los criterios de búsqueda o línea de investigación.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

