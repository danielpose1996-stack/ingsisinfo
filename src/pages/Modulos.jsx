import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerModulos, obtenerContenidosModulo, obtenerProyectosFinalizados, obtenerOvasModulo, registrarResultadoOva } from '../lib/supabase';
import { sanitizeHTML } from '../lib/security';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import QuizPlayer from '../components/QuizPlayer';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  ArrowLeft, 
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

function formatYoutubeUrl(url) {
  if (!url) return '';
  let embedUrl = url;
  if (embedUrl.includes('youtube.com/watch?v=')) {
    embedUrl = embedUrl.replace('watch?v=', 'embed/');
  } else if (embedUrl.includes('youtu.be/')) {
    embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
  }
  return embedUrl;
}

export default function Modulos() {
  const navigate = useNavigate();
  const [modulos, setModulos] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [contenidos, setContenidos] = useState({ guia: [], video: [], material: [], subpagina: [] });
  const [proyectosLinea, setProyectosLinea] = useState([]);
  const [activeTab, setActiveTab] = useState('ovas');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  
  // Modal for subpages
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
      setModulos(data);
    } catch (error) {
      console.error("Error loading modules:", error);
    } finally {
      setLoading(false);
    }
  }

  const fetchContenidos = async (moduloId, moduloNombre) => {
    setContentLoading(true);
    try {
      const [dataContenido, dataProyectos, dataOvas] = await Promise.all([
        obtenerContenidosModulo(moduloId),
        obtenerProyectosFinalizados(),
        obtenerOvasModulo(moduloId)
      ]);
      
      const grouped = {
        guia: dataContenido.filter(c => c.tipo === 'guia'),
        video: dataContenido.filter(c => c.tipo === 'video'),
        material: dataContenido.filter(c => c.tipo === 'material'),
        subpagina: dataContenido.filter(c => c.tipo === 'subpagina'),
        ovas: dataOvas.filter(o => o.estado === 'publicado')
      };
      setContenidos(grouped);
      setOvas(grouped.ovas);
      setProyectosLinea(dataProyectos.filter(p => p.docente?.linea_investigacion === moduloNombre));
    } catch (error) {
      console.error("Error al cargar contenidos/proyectos:", error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setActiveTab('ovas');
    fetchContenidos(module.id, module.nombre);
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

  // OVA Viewer State
  const [activeOvaStep, setActiveOvaStep] = useState(0);

  // Derived steps for the selected OVA
  const getOvaSteps = (ova) => {
    if (!ova) return [];
    
    // Parse evaluacion from actividad_final
    let evaluacion = null;
    if (ova.actividad_final) {
      try {
        const parsed = JSON.parse(ova.actividad_final);
        if (parsed && parsed.preguntas && parsed.preguntas.length > 0) {
          evaluacion = parsed;
        }
      } catch {
        // Legacy text format, not a quiz
      }
    }

    const steps = [
      { 
        id: 'intro', 
        titulo: 'Introducción', 
        tipo: 'intro',
        label: 'CONCEPTOS CLAVE',
        content: {
          titulo: ova.titulo,
          objetivo: ova.objetivo,
          introduccion: ova.introduccion,
          imagen: ova.imagen_portada
        }
      },
      ...(ova.contenido || []).map((section, idx) => ({
        id: `section-${idx}`,
        titulo: section.titulo,
        tipo: 'section',
        label: `MÓDULO 0${idx + 1}`,
        content: section
      })),
      {
        id: 'final',
        titulo: 'Evaluación',
        tipo: 'final',
        label: 'DESAFÍO FINAL',
        content: {
          actividad: ova.actividad_final,
          recursos: ova.recursos,
          evaluacion: evaluacion
        }
      }
    ];
    return steps;
  };

  const ovaSteps = getOvaSteps(selectedOva);
  const currentStep = ovaSteps[activeOvaStep];

  const handleNextStep = () => {
    if (activeOvaStep < ovaSteps.length - 1) {
      setActiveOvaStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeOvaStep > 0) {
      setActiveOvaStep(prev => prev - 1);
    }
  };

  const handleQuizComplete = async (score, percentage, passed) => {
    if (!user || !perfil) return;
    
    try {
      await registrarResultadoOva(perfil.id, selectedOva.id, percentage, passed);
      console.log("Resultado OVA registrado con éxito");
    } catch (error) {
      console.error("Error al registrar resultado OVA:", error);
    }
  };

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
              <h1 className="text-4xl md:text-5xl font-black text-foreground italic tracking-tight">
                Líneas de <span className="text-[#1E3A8A]">Aprendizaje</span>
              </h1>
              <p className="text-foreground/60 text-lg italic">
                Explora nuestras especialidades académicas e investigativas a través de recursos diseñados para tu crecimiento profesional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-64 rounded-3xl bg-card animate-pulse" />)
              ) : (
                modulos.map((mod) => (
                  <GlassCard 
                    key={mod.id} 
                    hover 
                    className="p-8 flex flex-col items-center justify-center text-center group cursor-pointer border-card-border hover:border-[#1E3A8A]/30"
                    onClick={() => handleModuleClick(mod)}
                  >
                    <div className="mb-6 p-5 rounded-2xl bg-card group-hover:bg-[#1E3A8A]/10 text-foreground/40 group-hover:text-[#1E3A8A] border border-card-border group-hover:border-[#1E3A8A]/20 transition-all duration-500 rotate-3 group-hover:rotate-0">
                      {getModuleIcon(mod.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'))}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight italic group-hover:text-[#1E3A8A] transition-colors uppercase">
                      {mod.nombre}
                    </h3>
                    <p className="text-foreground/60 text-sm italic leading-relaxed line-clamp-2">
                      {mod.descripcion || ''}
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      Entrar al Aula <ChevronRight className="w-3 h-3" />
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
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Detail Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-card-border">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setSelectedModule(null)}
                  className="p-3 rounded-xl bg-card hover:bg-white/10 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold text-foreground italic uppercase tracking-tighter">{selectedModule.nombre}</h2>
                  <p className="text-foreground/60 text-sm italic font-medium">Recursos académicos y material de apoyo</p>
                </div>
              </div>
              
              <div className="flex bg-card p-1 rounded-2xl overflow-x-auto custom-scrollbar">
                {[
                  { id: 'ovas', label: 'OVAs', icon: Cpu },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1E3A8A] text-white' : 'text-foreground/40 hover:text-foreground hover:bg-card'}`}
                  >
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Content List */}
            <div className="min-h-[400px]">
              {contentLoading ? (
                <div className="flex items-center justify-center h-full py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1E3A8A]/20 border-t-[#1E3A8A] rounded-full animate-spin" />
                    <p className="text-foreground/40 text-sm italic font-medium">Accediendo al repositorio...</p>
                  </div>
                </div>
              ) : activeTab === 'proyectos' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {proyectosLinea.length > 0 ? (
                    proyectosLinea.map(p => (
                      <GlassCard key={p.id} className="p-6 border-card-border hover:border-[#1E3A8A]/30 transition-all flex flex-col group">
                        <div className="flex-grow mb-6">
                          <div className="flex justify-between items-start mb-4">
                            <Badge variant="emerald">FINALIZADO</Badge>
                            <span className="text-[10px] text-foreground/40">{new Date(p.updated_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-xl font-bold text-foreground italic group-hover:text-[#1E3A8A] transition-colors mb-4 line-clamp-2 uppercase tracking-tight">{p.nombre}</h4>
                          <div className="space-y-2 pt-4 border-t border-card-border">
                            <p className="text-xs text-foreground/60"><span className="text-foreground/40 font-bold mr-2 uppercase tracking-widest text-[8px]">Autor</span> {p.estudiante?.nombre} {p.estudiante?.apellido}</p>
                            <p className="text-xs text-foreground/60"><span className="text-foreground/40 font-bold mr-2 uppercase tracking-widest text-[8px]">Asesor</span> {p.docente?.nombre} {p.docente?.apellido}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full gap-2 italic py-3 text-xs"
                          onClick={() => {
                            const url = p.versiones_proyecto?.[p.versiones_proyecto.length - 1]?.documento_url;
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4" /> REVISAR DOCUMENTO
                        </Button>
                      </GlassCard>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-card-border border-dashed">
                      <FolderOpen className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                      <p className="text-foreground/40 italic">No hay proyectos finalizados registrados en esta línea todavía.</p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'ovas' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {!isAdminOrTeacherOrStudent ? (
                    <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-3xl border border-card-border border-dashed">
                      <Lock className="w-12 h-12 text-amber-500/30 mx-auto mb-4" />
                      <p className="text-amber-500/70 italic font-bold">Contenido Protegido</p>
                      <p className="text-gray-600 text-xs mt-2 italic">Debes iniciar sesión como administrador, estudiante o docente para acceder a los OVAs.</p>
                    </div>
                  ) : ovas.length > 0 ? (
                    ovas.map(ova => (
                      <GlassCard 
                        key={ova.id} 
                        hover
                        className="flex flex-col h-full border-card-border group relative overflow-hidden"
                        onClick={() => {
                          if (ova.tipo === 'html') {
                            navigate(`/ova-html/${ova.id}`);
                          } else {
                            setSelectedOva(ova);
                            setActiveOvaStep(0);
                          }
                        }}
                      >
                         <div className="aspect-video relative overflow-hidden">
                           <img 
                             src={ova.imagen_portada || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800'} 
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                           <div className="absolute bottom-4 left-4 right-4">
                             <Badge variant="emerald" className="mb-2 italic">OVA INTERACTIVO</Badge>
                             <h4 className="text-lg font-bold text-foreground italic tracking-tight line-clamp-2">{ova.titulo}</h4>
                           </div>
                         </div>
                         <div className="p-6 flex-grow flex flex-col justify-between">
                           <p className="text-foreground/40 text-xs italic line-clamp-2 mb-6">{ova.descripcion || 'Objeto virtual de aprendizaje diseñado para la profundización técnica.'}</p>
                           <div className="flex items-center justify-between pt-4 border-t border-card-border">
                             <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic font-mono">Ver Contenido</span>
                             <div className="p-2 bg-[#1E3A8A]/10 rounded-lg text-[#1E3A8A]">
                               <Play className="w-4 h-4 fill-current" />
                             </div>
                           </div>
                         </div>
                      </GlassCard>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-3xl border border-card-border border-dashed">
                      <Cpu className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                      <p className="text-foreground/40 italic">No hay objetos virtuales de aprendizaje registrados todavía.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contenidos[activeTab]?.length > 0 ? (
                    contenidos[activeTab].map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        {activeTab === 'video' ? (
                          <div className="group bg-card rounded-2xl overflow-hidden border border-card-border hover:border-[#1E3A8A]/30 transition-all">
                            <div className="aspect-video relative bg-black/40">
                              <iframe 
                                src={formatYoutubeUrl(item.url_recurso)} 
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                              />
                            </div>
                            <div className="p-5">
                              <h4 className="text-foreground font-bold italic mb-2 group-hover:text-[#1E3A8A] transition-colors uppercase tracking-tight">{item.titulo}</h4>
                              <p className="text-foreground/60 text-xs italic line-clamp-2 leading-relaxed">
                                {item.descripcion || 'Clase técnica y demostración aplicada de la línea de investigación.'}
                              </p>
                            </div>
                          </div>
                        ) : activeTab === 'subpagina' ? (
                          <GlassCard 
                            hover 
                            className="p-8 flex flex-col items-center justify-center text-center cursor-pointer border-card-border"
                            onClick={() => setSelectedSubpage(item)}
                          >
                             <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center text-foreground/40 mb-6 group-hover:text-[#1E3A8A] transition-colors border border-card-border group-hover:rotate-12 duration-500">
                               <BookOpen className="w-7 h-7" />
                             </div>
                             <h4 className="text-lg font-bold text-foreground italic mb-2 tracking-tight group-hover:text-[#1E3A8A] transition-colors">{item.titulo}</h4>
                             <p className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest italic">Ver Contenido Especializado</p>
                          </GlassCard>
                        ) : (
                          <GlassCard hover className="p-6 flex items-start gap-4 border-card-border hover:border-[#1E3A8A]/20 group">
                             <div className="p-3 rounded-xl bg-card text-foreground/40 group-hover:text-[#1E3A8A] border border-card-border group-hover:border-[#1E3A8A]/30 transition-all">
                               {activeTab === 'guia' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                             </div>
                             <div className="flex-1">
                               <h4 className="text-foreground font-bold italic mb-1 group-hover:text-[#1E3A8A] transition-colors uppercase tracking-tight">{item.titulo}</h4>
                               <p className="text-foreground/60 text-[10px] italic leading-relaxed line-clamp-2 mb-4">
                                 {item.descripcion || 'Documentación oficial y recursos técnicos para la investigación.'}
                               </p>
                               <a 
                                 href={item.url_recurso} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-2 text-[10px] font-black text-[#1E3A8A] hover:text-[#1E3A8A] uppercase tracking-widest italic"
                               >
                                 {activeTab === 'guia' ? 'DESCARGAR GUÍA' : 'ACCEDER AL RECURSO'} <ExternalLink className="w-3 h-3" />
                               </a>
                             </div>
                          </GlassCard>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto opacity-20">
                        {activeTab === 'guia' ? <FileText className="w-10 h-10 text-foreground/60" /> : <Video className="w-10 h-10 text-foreground/60" />}
                      </div>
                      <p className="text-foreground/40 italic font-medium">Aún no hay {activeTab === 'material' ? 'material de apoyo' : activeTab + 's'} en esta sección.</p>
                      <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest italic">Próximamente estaremos actualizando el repositorio</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subpage Modal */}
      <Modal
        isOpen={!!selectedSubpage}
        onClose={() => setSelectedSubpage(null)}
        title={selectedSubpage?.titulo || 'Contenido Especializado'}
      >
        <div className="space-y-6">
          <div 
            className="prose dark:prose-invert max-w-none text-foreground/60 text-sm leading-relaxed italic"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedSubpage?.html_contenido) || '<p>Contenido en proceso de redacción...</p>' }}
          />
          <div className="pt-4 border-t border-card-border">
            <Button onClick={() => setSelectedSubpage(null)} className="w-full font-bold tracking-widest italic">CERRAR PÁGINA</Button>
          </div>
        </div>
      </Modal>

      {/* OVA Viewer Modal - Redesigned as an Interactive Player */}
      <Modal
        isOpen={!!selectedOva}
        onClose={() => setSelectedOva(null)}
        title={selectedOva?.titulo || 'Objeto Virtual de Aprendizaje'}
        maxWidth="max-w-6xl"
      >
        <div className="flex flex-col lg:flex-row h-[75vh] -m-6 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 bg-white/[0.02] border-r border-card-border flex flex-col h-full shrink-0">
            <div className="p-6 border-b border-card-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-[0.2em] italic">Progreso</span>
                <span className="text-[10px] font-bold text-foreground/40 italic font-mono">
                  {Math.round(((activeOvaStep + 1) / ovaSteps.length) * 100)}%
                </span>
              </div>
              <div className="h-1 bg-card rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#1E3A8A]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((activeOvaStep + 1) / ovaSteps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-2">
              {ovaSteps.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setActiveOvaStep(idx)}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 group ${activeOvaStep === idx ? 'bg-[#1E3A8A]/10 border border-[#1E3A8A]/20' : 'hover:bg-card border border-transparent'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black italic transition-all ${activeOvaStep === idx ? 'bg-[#1E3A8A] text-white' : 'bg-card text-foreground/40 group-hover:text-foreground'}`}>
                    0{idx + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className={`text-[8px] font-black uppercase tracking-widest italic mb-0.5 ${activeOvaStep === idx ? 'text-[#1E3A8A]' : 'text-gray-600'}`}>{step.label}</p>
                    <p className={`text-xs font-bold italic truncate ${activeOvaStep === idx ? 'text-foreground' : 'text-foreground/40'}`}>{step.titulo}</p>
                  </div>
                  {activeOvaStep > idx && <div className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] shadow-[0_0_8px_rgba(5,150,105,0.5)]" />}
                </button>
              ))}
            </div>
            
            <div className="p-6 border-t border-card-border">
              <Button 
                variant="outline" 
                className="w-full text-[10px] justify-center italic tracking-widest opacity-50 hover:opacity-100"
                onClick={() => setSelectedOva(null)}
              >
                SALIR DEL CURSO
              </Button>
            </div>
          </div>

          {/* Interaction Stage */}
          <div className="flex-grow flex flex-col h-full overflow-hidden bg-background">
            <div className="flex-grow overflow-y-auto custom-scrollbar p-8 lg:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep?.id}
                  initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="max-w-4xl mx-auto h-full"
                >
                  {currentStep?.tipo === 'intro' && (
                    <div className="space-y-10">
                      <div className="aspect-[21/9] rounded-3xl overflow-hidden relative group">
                        <img src={currentStep.content.imagen} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-10 left-10 right-10">
                          <Badge variant="emerald" className="mb-4">MÓDULO DE INICIO</Badge>
                          <h1 className="text-4xl lg:text-5xl font-black text-foreground italic tracking-tighter uppercase leading-[0.9] drop-shadow-lg">{currentStep.content.titulo}</h1>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                         <div className="space-y-4">
                           <h4 className="text-xs font-black text-[#1E3A8A] dark:text-[#1E3A8A] uppercase tracking-widest italic flex items-center gap-3">
                             <div className="w-8 h-px bg-[#1E3A8A]/50" /> Objetivo Central
                           </h4>
                           <p className="text-xl text-foreground font-bold italic leading-relaxed">{currentStep.content.objetivo}</p>
                         </div>
                         <div className="space-y-4">
                           <h4 className="text-xs font-black text-foreground/40 uppercase tracking-widest italic flex items-center gap-3">
                             <div className="w-8 h-px bg-card-border" /> Contextualización
                           </h4>
                           <p className="text-foreground/60 italic leading-relaxed text-sm">{currentStep.content.introduccion}</p>
                         </div>
                      </div>
                    </div>
                  )}

                  {currentStep?.tipo === 'section' && (
                    <div className="space-y-8 pb-10">
                       <div className="flex items-end justify-between gap-4 border-b border-card-border pb-8">
                         <div className="space-y-2">
                           <h4 className="text-[10px] font-black text-[#1E3A8A] dark:text-[#1E3A8A] uppercase tracking-[0.3em] font-mono italic">{currentStep.label}</h4>
                           <h2 className="text-4xl font-black text-foreground italic uppercase tracking-tighter">{currentStep.titulo}</h2>
                         </div>
                         <div className="text-5xl font-black text-foreground/5 italic select-none">0{activeOvaStep + 1}</div>
                       </div>

                       {/* Video Block */}
                       {currentStep.content.video_url && (
                         <div className="aspect-video rounded-3xl overflow-hidden border border-card-border bg-black/40">
                           <iframe
                             src={formatYoutubeUrl(currentStep.content.video_url)}
                             className="w-full h-full"
                             frameBorder="0"
                             allowFullScreen
                             title="Video"
                           />
                         </div>
                       )}

                       {/* Image Block */}
                       {currentStep.content.imagen_url && (
                         <div className="rounded-3xl overflow-hidden border border-card-border">
                           <img
                             src={currentStep.content.imagen_url}
                             alt={currentStep.titulo}
                             className="w-full max-h-[500px] object-cover"
                           />
                         </div>
                       )}

                       {/* Note Block */}
                       {currentStep.content.tipo === 'nota' && (
                         <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/15">
                           <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 rounded-xl bg-amber-500/20">
                               <ExternalLink className="w-5 h-5 text-amber-400" />
                             </div>
                             <span className="text-xs font-black text-amber-400 uppercase tracking-widest italic">Nota Importante</span>
                           </div>
                           {currentStep.content.contenido && (
                             <div
                               className="prose dark:prose-invert max-w-none text-foreground/80 text-base italic leading-relaxed"
                               dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentStep.content.contenido) }}
                             />
                           )}
                         </div>
                       )}

                       {/* Code Block */}
                       {currentStep.content.tipo === 'codigo' && currentStep.content.codigo && (
                         <div className="rounded-3xl bg-[#0d1117] border border-[#30363d] overflow-hidden">
                           <div className="flex items-center gap-2 px-6 py-3 bg-[#161b22] border-b border-[#30363d]">
                             <div className="flex gap-1.5">
                               <span className="w-3 h-3 rounded-full bg-[#f85149]/60" />
                               <span className="w-3 h-3 rounded-full bg-[#d29922]/60" />
                               <span className="w-3 h-3 rounded-full bg-[#3fb950]/60" />
                             </div>
                             <span className="text-xs text-[#8b949e] font-mono ml-2">{currentStep.content.lenguaje || 'code'}</span>
                           </div>
                           <pre className="px-6 py-5 text-sm text-[#c9d1d9] font-mono overflow-x-auto leading-relaxed">
                             <code>{currentStep.content.codigo}</code>
                           </pre>
                         </div>
                       )}

                       {/* Resource Block */}
                       {currentStep.content.tipo === 'recurso' && currentStep.content.recurso_url && (
                         <div className="p-8 rounded-3xl bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-between gap-6">
                           <div className="flex items-center gap-5">
                             <div className="p-4 rounded-2xl bg-cyan-500/20 text-cyan-400">
                               <ExternalLink className="w-6 h-6" />
                             </div>
                             <div>
                               <h5 className="text-foreground font-bold italic">{currentStep.content.recurso_titulo || 'Recurso Externo'}</h5>
                               <p className="text-[10px] text-foreground/40 italic uppercase tracking-widest font-bold truncate max-w-xs">{currentStep.content.recurso_url}</p>
                             </div>
                           </div>
                           <Button
                             onClick={() => window.open(currentStep.content.recurso_url, '_blank')}
                             variant="outline"
                             className="gap-2 italic text-xs py-4"
                           >
                              EXPLORAR <ExternalLink className="w-4 h-4" />
                           </Button>
                         </div>
                       )}

                       {/* Main Text Content (for texto/default blocks, or additional content on other blocks) */}
                       {currentStep.content.contenido && currentStep.content.tipo !== 'nota' && (
                         <GlassCard className="p-10 border-card-border bg-card">
                           <div
                             className="prose dark:prose-invert max-w-none text-foreground/80 text-lg italic leading-relaxed"
                             dangerouslySetInnerHTML={{ __html: sanitizeHTML(
                               currentStep.content.contenido.includes('<') 
                                 ? currentStep.content.contenido 
                                 : currentStep.content.contenido.replace(/\n/g, '<br/>')
                             ) }}
                           />
                         </GlassCard>
                       )}

                       {/* Legacy recurso_url support */}
                       {currentStep.content.recurso_url && currentStep.content.tipo !== 'recurso' && (
                         <div className="p-8 rounded-3xl bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 flex items-center justify-between gap-6">
                           <div className="flex items-center gap-5">
                             <div className="p-4 rounded-2xl bg-[#1E3A8A]/20 text-[#1E3A8A]">
                               <LinkIcon className="w-6 h-6" />
                             </div>
                             <div>
                               <h5 className="text-foreground font-bold italic">Recurso Adicional Detectado</h5>
                               <p className="text-[10px] text-foreground/40 italic uppercase tracking-widest font-bold">Material especializado de la sección</p>
                             </div>
                           </div>
                           <Button 
                             onClick={() => window.open(currentStep.content.recurso_url, '_blank')}
                             variant="outline"
                             className="gap-2 italic text-xs py-4"
                           >
                              EXPLORAR RECURSO <ExternalLink className="w-4 h-4" />
                           </Button>
                         </div>
                       )}
                    </div>
                  )}

                  {currentStep?.tipo === 'final' && (
                    <div className="h-full flex flex-col justify-center">
                      {currentStep.content.evaluacion ? (
                        /* Interactive Quiz */
                        <QuizPlayer
                          evaluacion={currentStep.content.evaluacion}
                          recursos={currentStep.content.recursos}
                          onComplete={handleQuizComplete}
                        />
                      ) : (
                        /* Legacy text-based evaluation */
                        <div className="max-w-3xl mx-auto text-center space-y-12">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#1E3A8A]/20 blur-[100px] rounded-full scale-150" />
                            <div className="relative">
                              <Terminal className="w-20 h-20 text-[#1E3A8A] mx-auto mb-8 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]" />
                              <h2 className="text-5xl font-black text-foreground italic uppercase tracking-tighter mb-4">Evaluación de Conocimiento</h2>
                              <p className="text-foreground/60 italic text-lg max-w-2xl mx-auto leading-relaxed">{currentStep.content.actividad}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                             {currentStep.content.recursos?.pdf_url && (
                                <GlassCard 
                                  hover
                                  className="p-6 border-card-border bg-white/[0.02] cursor-pointer"
                                  onClick={() => window.open(currentStep.content.recursos.pdf_url, '_blank')}
                                >
                                   <div className="flex items-center gap-4">
                                     <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"><FileText className="w-5 h-5" /></div>
                                     <div>
                                       <h5 className="text-foreground font-bold italic text-sm">Documentación PDF</h5>
                                       <p className="text-[10px] text-gray-600 font-bold uppercase italic tracking-widest">Guía Técnica Detallada</p>
                                     </div>
                                   </div>
                                </GlassCard>
                             )}
                             {currentStep.content.recursos?.youtube_url && (
                                <GlassCard 
                                  hover
                                  className="p-6 border-card-border bg-white/[0.02] cursor-pointer"
                                  onClick={() => window.open(currentStep.content.recursos.youtube_url, '_blank')}
                                >
                                   <div className="flex items-center gap-4">
                                     <div className="p-3 rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20"><Video className="w-5 h-5" /></div>
                                     <div>
                                       <h5 className="text-foreground font-bold italic text-sm">Material Audiovisual</h5>
                                       <p className="text-[10px] text-gray-600 font-bold uppercase italic tracking-widest">Video Explicativo</p>
                                     </div>
                                   </div>
                                </GlassCard>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="p-6 border-t border-card-border bg-card/50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <Button 
                   variant="outline" 
                   className="gap-2 italic disabled:opacity-20 transition-opacity"
                   onClick={handlePrevStep}
                   disabled={activeOvaStep === 0}
                 >
                   <ArrowLeft className="w-4 h-4" /> ANTERIOR
                 </Button>
               </div>

               <div className="hidden lg:flex items-center gap-2">
                 {ovaSteps.map((_, i) => (
                   <div 
                     key={i} 
                     className={`h-1 transition-all rounded-full ${i === activeOvaStep ? 'w-8 bg-[#1E3A8A]' : 'w-2 bg-white/10'}`} 
                   />
                 ))}
               </div>

               <Button 
                 variant={activeOvaStep === ovaSteps.length - 1 ? 'outline' : 'emerald'}
                 className="gap-2 italic"
                 onClick={activeOvaStep === ovaSteps.length - 1 ? () => setSelectedOva(null) : handleNextStep}
               >
                 {activeOvaStep === ovaSteps.length - 1 ? 'TERMINAR CURSO' : 'SIGUIENTE PASO'} 
                 <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


