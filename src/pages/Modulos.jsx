import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerModulos, obtenerOvasModulo, registrarResultadoOva } from '../lib/supabase';
import { sanitizeHTML } from '../lib/security';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import QuizPlayer from '../components/QuizPlayer';
import OvaViewer from '../components/OvaViewer';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  ArrowLeft, 
  ArrowRight,
  ExternalLink, 
  Play,
  Download,
  Terminal,
  Cpu,
  Share2,
  Database,
  Lock,
  ChevronRight,
  FolderOpen,
  X,
  Globe
} from 'lucide-react';

export default function Modulos() {
  const navigate = useNavigate();
  const [modulos, setModulos] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  
  // Modal para subpáginas
  const [selectedSubpage, setSelectedSubpage] = useState(null);
  const [selectedOva, setSelectedOva] = useState(null);
  const [ovas, setOvas] = useState([]);
  
  const { user, perfil, isAdmin } = useAuth();
  const isAdminOrTeacherOrStudent = isAdmin || (perfil && ['admin', 'docente', 'estudiante'].includes(perfil.rol));

  useEffect(() => {
    loadModulos();
  }, []);

  async function loadModulos() {
    setLoading(true);
    try {
      const data = await obtenerModulos();
      setModulos(data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
    } finally {
      setLoading(false);
    }
  }

  const fetchContenidos = async (moduloId) => {
    setContentLoading(true);
    try {
      const dataOvas = await obtenerOvasModulo(moduloId);
      setOvas((dataOvas || []).filter(o => o.estado === 'publicado'));
    } catch (error) {
      console.error("Error al cargar contenidos:", error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    fetchContenidos(module.id);
  };

  const getModuleIcon = (slug) => {
    const icons = {
      'ingenieria-de-software': <Terminal className="w-10 h-10" />,
      'robotica': <Cpu className="w-10 h-10" />,
      'ingenieria-del-conocimiento': <Database className="w-10 h-10" />,
      'redes-y-telematica': <Share2 className="w-10 h-10" />,
      'gestion-de-la-seguridad-informatica': <Lock className="w-10 h-10" />
    };
    return icons[slug] || <BookOpen className="w-10 h-10" />;
  };

  const formatYoutubeUrl = (url) => {
    if (!url) return '';
    let embedUrl = url;
    if (embedUrl.includes('youtube.com/watch?v=')) {
      embedUrl = embedUrl.replace('watch?v=', 'embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
    }
    return embedUrl;
  };

  const handleQuizComplete = async (score, percentage, passed) => {
    if (!user || !perfil || !selectedOva) return;
    
    try {
      await registrarResultadoOva(perfil.id, selectedOva.id, percentage, passed);
      console.log("Resultado OVA registrado con éxito");
    } catch (error) {
      console.error("Error al registrar resultado OVA:", error);
    }
  };

  // Si hay un OVA interactivo seleccionado, renderizar la experiencia inmersiva completa
  if (selectedOva) {
    return (
      <OvaViewer
        ova={selectedOva}
        modulo={selectedModule}
        onClose={() => setSelectedOva(null)}
        onQuizComplete={handleQuizComplete}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimatePresence mode="wait">
        {!selectedModule ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -25 }}
            className="space-y-12"
          >
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                Líneas de <span className="text-[#10346E]">Aprendizaje</span>
              </h1>
              <p className="text-foreground/60 text-base sm:text-lg">
                Explora nuestras especialidades académicas e investigativas a través de recursos diseñados para tu crecimiento profesional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-64 rounded-3xl bg-card animate-pulse" />)
              ) : (
                modulos.map((mod) => (
                  <div 
                    key={mod.id} 
                    className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center group cursor-pointer hover:border-[#10346E]/30"
                    onClick={() => handleModuleClick(mod)}
                  >
                    <div className="mb-6 p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 group-hover:bg-[#10346E]/10 text-slate-500 group-hover:text-[#10346E] dark:text-slate-400 dark:group-hover:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 transition-all duration-300">
                      {getModuleIcon(mod.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'))}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight group-hover:text-[#10346E] dark:group-hover:text-blue-400 transition-colors uppercase">
                      {mod.nombre}
                    </h3>
                    <p className="text-foreground/60 text-sm leading-relaxed line-clamp-2">
                      {mod.descripcion || ''}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#10346E] dark:text-blue-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <span>Entrar al Aula</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Encabezado del detalle de la Línea de Aprendizaje */}
            <div className="flex items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedModule(null)}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                  title="Volver a las líneas"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                    {selectedModule.nombre}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal mt-0.5">
                    Recursos académicos y material de apoyo
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10346E] text-white text-xs font-bold tracking-wider uppercase shadow-sm">
                  <Cpu className="w-4 h-4" />
                  <span>OVAS</span>
                </div>
              </div>
            </div>

            {/* Contenedor Principal de Tarjetas */}
            <div className="min-h-[400px]">
              {contentLoading ? (
                <div className="flex items-center justify-center h-full py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#10346E]/20 border-t-[#10346E] rounded-full animate-spin" />
                    <p className="text-foreground/50 text-sm font-medium">Accediendo a los contenidos...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F4F6F9] dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8">
                  {!isAdminOrTeacherOrStudent ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <Lock className="w-12 h-12 text-amber-500/60 mx-auto mb-4" />
                      <p className="text-amber-600 dark:text-amber-400 font-bold text-sm">Contenido Protegido</p>
                      <p className="text-slate-500 text-xs mt-2">Debes iniciar sesión con tu cuenta institucional para acceder a los OVAs.</p>
                    </div>
                  ) : ovas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {ovas.map(ova => (
                        <div 
                          key={ova.id} 
                          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group cursor-pointer"
                          onClick={() => {
                            if (ova.tipo === 'html') {
                              navigate(`/ova-html/${ova.id}`);
                            } else {
                              setSelectedOva(ova);
                              setActiveOvaStep(0);
                            }
                          }}
                        >
                          {/* Imagen superior con Badge OVA INTERACTIVO */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img 
                              src={ova.imagen_portada || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800'} 
                              alt={ova.titulo}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';
                              }}
                            />
                            
                            {/* Badge OVA INTERACTIVO sobre la imagen en la esquina inferior izquierda */}
                            <div className="absolute bottom-3 left-3">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#10346E] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                OVA INTERACTIVO
                              </span>
                            </div>
                          </div>

                          {/* Contenido inferior sobre fondo blanco */}
                          <div className="p-6 flex flex-col flex-grow justify-between bg-white dark:bg-slate-900">
                            <div>
                              <h3 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight mb-2 line-clamp-1 group-hover:text-[#10346E] dark:group-hover:text-blue-400 transition-colors">
                                {ova.titulo}
                              </h3>
                              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed line-clamp-3 mb-6">
                                {ova.descripcion || 'Objeto virtual de aprendizaje diseñado para la profundización técnica y práctica.'}
                              </p>
                            </div>

                            {/* Pie de tarjeta con Ver contenido y botón azul */}
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs sm:text-sm font-bold text-[#10346E] dark:text-blue-400">
                                Ver contenido
                              </span>
                              <div className="w-10 h-10 rounded-xl bg-[#10346E] group-hover:bg-[#18458F] text-white flex items-center justify-center transition-all duration-200 shadow-sm group-hover:scale-105">
                                <ArrowRight className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-foreground/40 text-sm">No hay objetos virtuales de aprendizaje registrados todavía.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de subpágina */}
      <Modal
        isOpen={!!selectedSubpage}
        onClose={() => setSelectedSubpage(null)}
        title={selectedSubpage?.titulo || 'Contenido Especializado'}
      >
        <div className="space-y-6">
          <div 
            className="prose dark:prose-invert max-w-none text-foreground/70 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedSubpage?.html_contenido) || '<p>Contenido en proceso de redacción...</p>' }}
          />
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => setSelectedSubpage(null)} className="w-full font-bold">CERRAR PÁGINA</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
