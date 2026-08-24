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
import CourseViewer from '../components/CourseViewer';
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

  // Si hay un OVA o Curso seleccionado, renderizar la experiencia inmersiva correspondiente
  if (selectedOva) {
    if (selectedOva.tipo === 'curso') {
      return (
        <CourseViewer
          ova={selectedOva}
          modulo={selectedModule}
          onClose={() => setSelectedOva(null)}
          onProgressUpdate={() => {
            if (selectedModule?.id) fetchContenidos(selectedModule.id);
          }}
        />
      );
    }
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
              <p className="text-foreground/60 text-lg leading-relaxed">
                Explora los módulos de profundización y Objetos Virtuales de Aprendizaje desarrollados por el semillero.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-64 rounded-3xl bg-card animate-pulse" />)
              ) : (
                modulos.map((modulo, index) => (
                  <GlassCard 
                    key={modulo.id}
                    hover
                    className="flex flex-col justify-between p-8 border-card-border/60 hover:border-[#10346E]/30 transition-all duration-300 group cursor-pointer"
                    onClick={() => handleModuleClick(modulo)}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#10346E] dark:text-blue-400 group-hover:scale-110 group-hover:bg-[#10346E] group-hover:text-white transition-all duration-300">
                          {getModuleIcon(modulo.slug)}
                        </div>
                        <Badge variant="blue" size="sm" className="font-mono">
                          MOD-0{index + 1}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-[#10346E] dark:group-hover:text-blue-400 transition-colors">
                          {modulo.nombre}
                        </h3>
                        <p className="text-foreground/60 text-sm line-clamp-3 leading-relaxed">
                          {modulo.descripcion || 'Módulo especializado de formación técnica y proyectos de investigación.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-card-border/40 flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/40 group-hover:text-foreground/70 transition-colors">
                        Explorar contenidos
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground/40 group-hover:bg-[#10346E] group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 25 }}
            className="space-y-8"
          >
            {/* Cabecera del Módulo Seleccionado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-card-border">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedModule(null)}
                  className="rounded-xl border-card-border hover:bg-card text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a líneas
                </Button>
                <div>
                  <h2 className="text-2xl font-black text-foreground">
                    {selectedModule.nombre}
                  </h2>
                  <p className="text-xs text-foreground/50">
                    Objetos Virtuales de Aprendizaje y Cursos de la Línea
                  </p>
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
                      <p className="text-slate-500 text-xs mt-2">Debes iniciar sesión con tu cuenta institucional para acceder a los OVAs y cursos.</p>
                    </div>
                  ) : ovas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {ovas.map(ova => {
                        const isCurso = ova.tipo === 'curso';
                        const isHtml = ova.tipo === 'html';

                        let lessonCount = 0;
                        let sectionCount = 0;
                        if (isCurso && ova.contenido) {
                          const data = typeof ova.contenido === 'object' ? ova.contenido : {};
                          const secs = data.secciones || (Array.isArray(ova.contenido) ? ova.contenido : []);
                          sectionCount = secs.length;
                          lessonCount = secs.reduce((acc, s) => acc + (s.lecciones?.length || 0), 0);
                        }

                        return (
                          <div 
                            key={ova.id} 
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group cursor-pointer"
                            onClick={() => {
                              if (ova.tipo === 'html') {
                                navigate(`/ova-html/${ova.id}`);
                              } else {
                                setSelectedOva(ova);
                              }
                            }}
                          >
                            {/* Imagen superior con Badge */}
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
                              
                              {/* Badge sobre la imagen en la esquina inferior izquierda */}
                              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                {isCurso ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm">
                                    <Play className="w-3 h-3 fill-white" />
                                    CURSO EN VIDEO
                                  </span>
                                ) : isHtml ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                    <Globe className="w-3 h-3" />
                                    PAQUETE WEB
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#10346E] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                    OVA INTERACTIVO
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Contenido inferior */}
                            <div className="p-6 flex flex-col flex-grow justify-between bg-white dark:bg-slate-900">
                              <div>
                                {isCurso && lessonCount > 0 && (
                                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1">
                                    {lessonCount} {lessonCount === 1 ? 'lección' : 'lecciones'} · {sectionCount} {sectionCount === 1 ? 'sección' : 'secciones'}
                                  </span>
                                )}
                                <h3 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight mb-2 line-clamp-1 group-hover:text-[#10346E] dark:group-hover:text-blue-400 transition-colors">
                                  {ova.titulo}
                                </h3>
                                <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed line-clamp-3 mb-6">
                                  {ova.descripcion || (isCurso ? 'Curso estructurado en video con lecciones progresivas y autoevaluación.' : 'Objeto virtual de aprendizaje diseñado para la profundización técnica y práctica.')}
                                </p>
                              </div>

                              {/* Pie de tarjeta con Ver contenido y botón azul */}
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs sm:text-sm font-bold text-[#10346E] dark:text-blue-400">
                                  {isCurso ? 'Iniciar curso' : 'Ver contenido'}
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-[#10346E] group-hover:bg-[#18458F] text-white flex items-center justify-center transition-all duration-200 shadow-sm group-hover:scale-105">
                                  <ArrowRight className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
