import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerProyectosFinalizados, eliminarProyecto } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { 
  Download, FileText, Search, Filter, BookOpen, 
  User as UserIcon, Calendar, Lock, LogIn, Trash2
} from 'lucide-react';

export default function Repositorio() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLinea, setFilterLinea] = useState('');
  const [searchNombre, setSearchNombre] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const proys = await obtenerProyectosFinalizados();
        setProyectos(proys || []);
      } catch (error) {
        console.error("Error loading repository data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, authLoading]);

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${nombre}" permanentemente?`)) return;
    
    try {
      await eliminarProyecto(id);
      setProyectos(prev => prev.filter(p => p.id !== id));
      alert('Proyecto eliminado exitosamente');
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      alert('Error al eliminar el proyecto');
    }
  };

  const filteredProyectos = proyectos
    .filter(p => !filterLinea || p.linea_investigacion === filterLinea)
    .filter(p => !searchNombre || 
      `${p.estudiante?.nombre} ${p.estudiante?.apellido}`.toLowerCase().includes(searchNombre.toLowerCase()) ||
      p.nombre.toLowerCase().includes(searchNombre.toLowerCase())
    );

  if (authLoading || loading) {
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

  // Vista restringida para usuarios no registrados
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <GlassCard className="p-12 text-center relative overflow-hidden text-balance">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[80px] -z-10" />
            
            <div className="mb-8 flex justify-center">
              <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                <Lock className="w-12 h-12 text-emerald-400" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 italic tracking-tight">
              ACCESO <span className="text-emerald-400">RESTRINGIDO</span>
            </h2>
            
            <p className="text-foreground/60 text-lg mb-10 italic max-w-md mx-auto leading-relaxed">
              El archivo histórico de proyectos es exclusivo para miembros de la comunidad SISINFO. 
              Por favor, inicia sesión para explorar el repositorio.
            </p>

            <Link to="/login">
              <Button size="lg" className="gap-3 px-10 py-6 rounded-2xl shadow-2xl shadow-emerald-500/20">
                <LogIn className="w-5 h-5" />
                INICIAR SESIÓN AHORA
              </Button>
            </Link>

            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
              {['Estudiantes', 'Docentes', 'Admin'].map((role) => (
                <div key={role} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{role}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
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
                      <div className="flex gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(p.id, p.nombre)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            title="Eliminar Proyecto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
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

