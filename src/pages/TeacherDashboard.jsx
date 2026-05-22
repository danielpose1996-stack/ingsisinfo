import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerProyectosDocente, 
  enviarObservacion, 
  finalizarProyecto,
  subirDocumento,
  actualizarEstadoProyecto,
  descargarArchivo,
  obtenerModulos,
  obtenerOvasModulo,
  crearOva,
  actualizarOva,
  eliminarOva,
  subirArchivoOva
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import OvaEditor from './OvaEditor';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Download, 
  MessageSquare, 
  Send,
  Loader2,
  FileCheck,
  History,
  AlertCircle,
  FileText,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherDashboard() {
  const { user, perfil } = useAuth();
  const [activeTab, setActiveTab] = useState('revision');
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  
  // Action states
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalFile, setFinalFile] = useState(null);
  const [confirmPass, setConfirmPass] = useState('');

  // Aula Virtual State
  const [docenteModulo, setDocenteModulo] = useState(null);
  const [ovas, setOvas] = useState([]);
  const [loadingOvas, setLoadingOvas] = useState(false);
  const [ovaForm, setOvaForm] = useState(null);
  const [editingOva, setEditingOva] = useState(null);
  const [isOvaFormOpen, setIsOvaFormOpen] = useState(false);

  // Persistence State
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  useEffect(() => {
    if (user && perfil && !hasLoadedInitial) {
      loadData();
    }
  }, [user, perfil, hasLoadedInitial]);

  // 1. Detección de borradores al abrir el editor
  useEffect(() => {
    if (isOvaFormOpen && !editingOva) {
      const draft = localStorage.getItem('ova_draft_new');
      if (draft) {
        setHasDraft(true);
        setDraftData(JSON.parse(draft));
      }
    } else if (isOvaFormOpen && editingOva) {
      const draft = localStorage.getItem(`ova_draft_${editingOva.id}`);
      if (draft) {
        setHasDraft(true);
        setDraftData(JSON.parse(draft));
      }
    } else {
      setHasDraft(false);
      setDraftData(null);
    }
  }, [isOvaFormOpen, editingOva]);

  // 2. Efecto de Autoguardado (sync con localStorage)
  useEffect(() => {
    if (isOvaFormOpen && ovaForm) {
      const draftKey = editingOva ? `ova_draft_${editingOva.id}` : 'ova_draft_new';
      const draftContent = {
        ...ovaForm,
        lastSaved: new Date().toISOString()
      };
      
      // Solo guardar si hay cambios significativos
      localStorage.setItem(draftKey, JSON.stringify(draftContent));
    }
  }, [ovaForm, isOvaFormOpen, editingOva]);

  async function loadData() {
    if (loading && hasLoadedInitial) return; // Evitar doble carga
    
    setLoading(true);
    try {
      const data = await obtenerProyectosDocente(perfil.id);
      setProyectos(data);

      // Auto-detect module for Aula Virtual
      const modulos = await obtenerModulos();
      const match = modulos.find(m => m.nombre === perfil.linea_investigacion);
      if (match) {
        setDocenteModulo(match);
        // Solo cargar ovas si no las tenemos o si es cambio de módulo
        if (ovas.length === 0) {
          await loadOvas(match.id);
        }
      }
      setHasLoadedInitial(true);
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  }

  const loadOvas = async (moduloId) => {
    // Si ya estamos cargando, no repetir
    if (loadingOvas) return;

    setLoadingOvas(true);
    try {
      const data = await obtenerOvasModulo(moduloId);
      setOvas(data);
    } catch (error) {
      console.error('Error loading OVAs:', error);
    } finally {
      setLoadingOvas(false);
    }
  };

  const handleRecoverDraft = () => {
    if (draftData) {
      setOvaForm(draftData);
      setHasDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    const draftKey = editingOva ? `ova_draft_${editingOva.id}` : 'ova_draft_new';
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setDraftData(null);
  };

  // ─── OVA Handlers ───
  const handleCreateOva = () => {
    setEditingOva(null);
    setOvaForm({
      titulo: '',
      descripcion: '',
      imagen_portada: '',
      objetivo: '',
      introduccion: '',
      contenido: [{ _id: `section-${Date.now()}-0`, titulo: '', contenido: '', recurso_url: '', tipo: 'texto' }],
      recursos: { pdf_url: '', youtube_url: '', link_externo: '' },
      actividad_final: '',
      evaluacion: { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 },
      estado: 'borrador',
      tipo: 'manual',
      archivo_html_url: ''
    });
    setIsOvaFormOpen(true);
  };

  const handleEditOva = (ova) => {
    setEditingOva(ova);
    let evaluacion = { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 };
    if (ova.actividad_final) {
      try {
        const parsed = JSON.parse(ova.actividad_final);
        if (parsed && parsed.preguntas) evaluacion = parsed;
      } catch { evaluacion.instrucciones = ova.actividad_final; }
    }
    setOvaForm({
      ...ova,
      tipo: ova.tipo || 'manual',
      archivo_html_url: ova.archivo_html_url || '',
      contenido: (ova.contenido || []).map((s, i) => ({ ...s, _id: s._id || `section-${Date.now()}-${i}`, tipo: s.tipo || 'texto' })),
      recursos: ova.recursos || { pdf_url: '', youtube_url: '', link_externo: '' },
      evaluacion,
    });
    setIsOvaFormOpen(true);
  };

  const handleSaveOva = async () => {
    if (!ovaForm.titulo.trim()) {
      toast.error('El título es obligatorio.');
      return;
    }
    if (ovaForm.tipo === 'html' && !ovaForm.archivo_html_url) {
      toast.error('Debe subir un archivo HTML para este tipo de OVA.');
      return;
    }
    try {
      const cleanedContenido = ovaForm.contenido.map(({ _id, ...c }) => ({ ...c, titulo: sanitizeText(c.titulo) }));
      const evaluacionData = ovaForm.evaluacion || { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 };
      const dataToSave = {
        titulo: sanitizeText(ovaForm.titulo),
        descripcion: sanitizeText(ovaForm.descripcion),
        imagen_portada: ovaForm.imagen_portada || '',
        objetivo: sanitizeText(ovaForm.objetivo),
        introduccion: ovaForm.introduccion || '',
        actividad_final: JSON.stringify(evaluacionData),
        contenido: cleanedContenido,
        recursos: ovaForm.recursos || {},
        estado: ovaForm.estado || 'borrador',
        modulo_id: docenteModulo.id,
        tipo: ovaForm.tipo || 'manual',
        archivo_html_url: ovaForm.archivo_html_url || ''
      };
      if (editingOva) {
        await actualizarOva(editingOva.id, dataToSave);
      } else {
        await crearOva(dataToSave);
      }
      setIsOvaFormOpen(false);
      // Limpiar borrador tras guardado exitoso
      const draftKey = editingOva ? `ova_draft_${editingOva.id}` : 'ova_draft_new';
      localStorage.removeItem(draftKey);
      
      loadOvas(docenteModulo.id);
      toast.success('OVA guardado con éxito.');
    } catch (error) {
      toast.error('Error al guardar OVA: ' + error.message);
    }
  };

  const handleDeleteOva = async (id) => {
    const res = await Swal.fire({
      title: '¿Eliminar OVA?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    });
    if (!res.isConfirmed) return;
    
    try {
      await eliminarOva(id);
      loadOvas(docenteModulo.id);
      toast.success('OVA eliminado con éxito.');
    } catch (error) { console.error('Error deleting OVA:', error); toast.error('Error al eliminar OVA.'); }
  };

  const handleToggleOvaStatus = async (ova) => {
    try {
      await actualizarOva(ova.id, { estado: ova.estado === 'publicado' ? 'borrador' : 'publicado' });
      loadOvas(docenteModulo.id);
    } catch (error) { console.error('Error toggling status:', error); }
  };

  const handleOvaFileUpload = async (e, type, sectionIndex = -1) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await subirArchivoOva(file, `ovas/${Date.now()}`);
      if (type === 'portada') {
        setOvaForm({ ...ovaForm, imagen_portada: url });
      } else if (type === 'pdf') {
        setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, pdf_url: url } });
      } else if (type === 'html') {
        setOvaForm({ ...ovaForm, archivo_html_url: url });
      } else if (type === 'seccion_imagen' && sectionIndex >= 0) {
        const newContenido = [...ovaForm.contenido];
        newContenido[sectionIndex] = { ...newContenido[sectionIndex], imagen_url: url };
        setOvaForm({ ...ovaForm, contenido: newContenido });
      }
    } catch (error) { toast.error('Error al subir archivo: ' + error.message); }
  };

  const handleSendObservation = async (e) => {
    e.preventDefault();
    if (!observacion.trim() || !perfil?.id) return;
    
    setIsSubmitting(true);
    try {
      await enviarObservacion(selectedProyecto.id, perfil.id, sanitizeText(observacion));
      setIsObsModalOpen(false);
      setObservacion('');
      // Recargar datos solo si aún tenemos perfil
      if (perfil?.id) {
        await loadData();
      }
      toast.success('Observación enviada con éxito.');
    } catch (error) {
      console.error("Error al enviar observación:", error);
      toast.error('Error al enviar observación: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!finalFile) {
      toast.error('Debes adjuntar el documento final');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Finalizar proyecto subirá el documento y marcará como terminado
      await finalizarProyecto(selectedProyecto.id, finalFile, perfil.id);
      
      setIsFinalizeModalOpen(false);
      setFinalFile(null);
      setConfirmPass('');
      await loadData();
      toast.success('Proyecto finalizado y aprobado con éxito.');
    } catch (error) {
      toast.error('Error al finalizar proyecto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhaseChange = async (proyectoId, nuevoEstado) => {
    const res = await Swal.fire({
      title: `¿Cambiar a ${nuevoEstado.toUpperCase()}?`,
      text: "Se notificará al estudiante.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    });
    if (!res.isConfirmed) return;

    try {
      await actualizarEstadoProyecto(proyectoId, nuevoEstado);
      await loadData();
      toast.success('Fase del proyecto actualizada.');
    } catch (error) {
      toast.error('Error al cambiar fase: ' + error.message);
    }
  };

  const handleDownload = (proyecto) => {
    const version = proyecto.versiones_proyecto?.[proyecto.versiones_proyecto.length - 1];
    if (!version || !version.documento_url) {
      toast.error('Este proyecto aún no tiene un documento registrado o la subida falló anteriormente.');
      return;
    }
    
    descargarArchivo(version.documento_url, version.nombre_archivo);
  };

  const enRevision = proyectos.filter(p => !p.terminado);
  const terminados = proyectos.filter(p => p.terminado);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-card-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Docente</h1>
          <p className="text-foreground/60 font-medium italic">
            Bienvenido, {perfil?.nombre} — <span className="text-blue-500">{perfil?.linea_investigacion || 'Investigador'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 bg-card p-1 rounded-2xl border border-card-border">
           <button 
            onClick={() => setActiveTab('revision')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'revision' ? 'bg-blue-500 text-foreground shadow-lg shadow-blue-500/20' : 'text-foreground/40 hover:text-foreground hover:bg-background'}`}
          >
            <BookOpen className="w-4 h-4" /> En Revisión ({enRevision.length})
          </button>
          <button 
            onClick={() => setActiveTab('terminados')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'terminados' ? 'bg-blue-500 text-foreground shadow-lg shadow-blue-500/20' : 'text-foreground/40 hover:text-foreground hover:bg-background'}`}
          >
            <CheckCircle className="w-4 h-4" /> Historial ({terminados.length})
          </button>
          <button 
            onClick={() => { setActiveTab('aula'); setIsOvaFormOpen(false); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'aula' ? 'bg-[#1E3A8A] text-foreground shadow-lg shadow-[#1E3A8A]/20' : 'text-foreground/40 hover:text-foreground hover:bg-background'}`}
          >
            <GraduationCap className="w-4 h-4" /> Aula Virtual
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab !== 'aula' && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {activeTab === 'revision' ? (
            enRevision.length > 0 ? (
              enRevision.map(p => (
                <GlassCard key={p.id} className="flex flex-col h-full border-card-border hover:border-blue-500/30 transition-all group">
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="blue">{p.estado.toUpperCase()}</Badge>
                      <span className="text-[10px] text-foreground/40 font-mono italic px-1">Registrado: {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-lg font-bold text-foreground mb-4 italic group-hover:text-blue-500 transition-colors uppercase tracking-tight">{p.nombre}</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-foreground/60">
                        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-[10px] text-blue-500 font-bold border border-card-border italic shadow-sm">
                          {(p.estudiante?.nombre || 'U')[0]}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter italic">Estudiante</p>
                          <p className="text-foreground font-medium">{p.estudiante?.nombre} {p.estudiante?.apellido}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-foreground/60 bg-card p-3 rounded-xl border border-card-border">
                        <History className="w-4 h-4 text-blue-500" />
                        <span><strong className="text-foreground">{p.versiones_proyecto?.length || 0}</strong> versiones · <strong className="text-foreground">{p.observaciones?.length || 0}</strong> observaciones</span>
                      </div>

                      {/* Phase Selector */}
                      <div className="pt-2">
                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mb-2 italic">Fase Actual</p>
                        <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-card-border">
                          {['propuesta', 'desarrollo', 'aplicacion'].map(fase => (
                            <button
                              key={fase}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePhaseChange(p.id, fase);
                              }}
                              className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${p.estado === fase ? 'bg-blue-500 text-foreground shadow-lg shadow-blue-500/20' : 'text-foreground/40 hover:text-foreground hover:bg-card'}`}
                            >
                              {fase.slice(0, 4)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-card border-t border-card-border grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleDownload(p)} 
                      className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-blue-500/10 text-foreground/40 hover:text-blue-500 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-widest italic font-mono">Doc</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedProyecto(p); setIsObsModalOpen(true); }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-amber-500/10 text-foreground/40 hover:text-amber-500 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-widest italic font-mono">Obs</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (p.estado !== 'aplicacion') {
                          toast.error('El proyecto debe estar en fase de APLICACIÓN para ser aprobado.');
                          return;
                        }
                        setSelectedProyecto(p); 
                        setIsFinalizeModalOpen(true); 
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${p.estado === 'aplicacion' ? 'hover:bg-blue-500/10 text-blue-400' : 'opacity-20 cursor-not-allowed text-gray-600'}`}
                    >
                      <FileCheck className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-widest italic">Aprobar</span>
                    </button>
                  </div>
                </GlassCard>
              ))
            ) : (
               <div className="col-span-full py-24 text-center">
                <p className="text-foreground/40 italic">No tienes proyectos pendientes de revisión.</p>
              </div>
            )
          ) : (
            terminados.length > 0 ? (
              terminados.map(p => (
                <GlassCard key={p.id} className="border-[#1E3A8A]/20 bg-[#1E3A8A]/5">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-[#1E3A8A]" />
                    <h4 className="text-lg font-bold text-foreground italic">{p.nombre}</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-foreground/60">Estudiante: {p.estudiante?.nombre} {p.estudiante?.apellido}</p>
                    <p className="text-foreground/40">Completado el: {new Date(p.updated_at).toLocaleDateString()}</p>
                  </div>
                </GlassCard>
              ))
            ) : (
               <div className="col-span-full py-24 text-center">
                <p className="text-foreground/40 italic">Aún no has finalizado ningún proyecto.</p>
              </div>
            )
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════ */}
      {/* AULA VIRTUAL TAB                        */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === 'aula' && (
        <div className="space-y-6">
          {!docenteModulo ? (
            <GlassCard className="p-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center text-gray-600">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground italic">Sin Módulo Asignado</h3>
              <p className="text-foreground/40 italic max-w-sm leading-relaxed">
                No se encontró un módulo de Aula Virtual asociado a tu línea de investigación ({perfil?.linea_investigacion || 'No definida'}). Contacta a un administrador.
              </p>
            </GlassCard>
          ) : isOvaFormOpen && ovaForm ? (
            <OvaEditor
              ovaForm={ovaForm}
              setOvaForm={setOvaForm}
              editingOva={editingOva}
              onSave={handleSaveOva}
              onCancel={() => setIsOvaFormOpen(false)}
              onFileUpload={handleOvaFileUpload}
              hasDraft={hasDraft}
              draftData={draftData}
              onRecoverDraft={handleRecoverDraft}
              onDiscardDraft={handleDiscardDraft}
            />
          ) : (
            <div className="space-y-6">
              {/* Module Header + Create Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-foreground italic tracking-tight uppercase">
                    {docenteModulo.nombre}
                  </h3>
                  <p className="text-xs text-foreground/40 italic font-mono uppercase tracking-widest">Gestión de Objetos Virtuales de Aprendizaje</p>
                </div>
                <Button onClick={handleCreateOva} className="gap-2 italic py-3 px-8 text-xs font-black tracking-[0.2em]">
                  <Plus className="w-4 h-4" /> CREAR OVA
                </Button>
              </div>

              {/* OVA List */}
              {loadingOvas ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl bg-card animate-pulse" />)}
                </div>
              ) : ovas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ovas.map(ova => (
                    <GlassCard key={ova.id} className="p-6 border-card-border group hover:border-[#1E3A8A]/30 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <Badge variant={ova.estado === 'publicado' ? 'emerald' : 'amber'}>
                          {ova.estado?.toUpperCase()}
                        </Badge>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleOvaStatus(ova)}
                            title={ova.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
                            className="p-2 rounded-lg bg-card hover:bg-white/10 text-foreground/60 hover:text-[#1E3A8A]"
                          >
                            {ova.estado === 'publicado' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEditOva(ova)}
                            className="p-2 rounded-lg bg-card hover:bg-white/10 text-foreground/60 hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOva(ova.id)}
                            className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-foreground/60 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-lg font-bold text-foreground italic mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-[#1E3A8A] transition-colors tracking-tight leading-tight">
                        {ova.titulo}
                      </h4>

                      <div className="space-y-4 pt-4 border-t border-card-border">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-foreground/40 font-bold uppercase tracking-widest italic font-mono">Última Modificación</span>
                          <span className="text-foreground/60">{new Date(ova.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-foreground/40 font-bold uppercase tracking-widest italic font-mono">Secciones</span>
                          <span className="text-foreground/60">{ova.contenido?.length || 0} bloques</span>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                  <GraduationCap className="w-12 h-12 text-foreground/10" />
                  <h3 className="text-lg font-bold text-foreground/40 italic">Sin OVAs creados</h3>
                  <p className="text-foreground/30 italic text-sm max-w-sm">Crea tu primer Objeto Virtual de Aprendizaje para esta línea de investigación.</p>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Observation Modal */}
      <Modal 
        isOpen={isObsModalOpen} 
        onClose={() => setIsObsModalOpen(false)}
        title="Enviar Observaciones"
      >
        <form onSubmit={handleSendObservation} className="space-y-6">
          {selectedProyecto && (
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-widest px-1 italic">Historial de Correcciones</label>
              <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {selectedProyecto.versiones_proyecto?.length > 0 ? (
                  [...selectedProyecto.versiones_proyecto].reverse().map((v, idx) => (
                    <div key={v.id} className="p-3 bg-card rounded-xl border border-card-border">
                      <div className="flex justify-between items-start mb-1 text-[9px] font-bold uppercase tracking-widest">
                        <span className="text-blue-500">VERSIÓN {v.version || (selectedProyecto.versiones_proyecto.length - idx)}</span>
                        <span className="text-foreground/40">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-foreground font-medium italic truncate mb-1">{v.nombre_archivo}</p>
                      {v.comentario_estudiante && (
                        <p className="text-[10px] text-foreground/60 italic bg-background/50 p-2 rounded-lg leading-relaxed border border-card-border">
                          "{v.comentario_estudiante}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-600 italic px-1">Sin versiones registradas.</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3 px-1 italic">
              Retroalimentación Técnica
            </label>
            <textarea 
              required
              rows={6}
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="Describe detalladamente las correcciones o sugerencias para el estudiante..."
              className="w-full bg-card border border-card-border rounded-2xl p-4 text-sm text-foreground focus:outline-none focus:border-blue-500/50 transition-all font-medium italic resize-none shadow-inner"
            />
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsObsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar Revisión</>}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Finalize Modal */}
      <Modal 
        isOpen={isFinalizeModalOpen} 
        onClose={() => setIsFinalizeModalOpen(false)}
        title="Finalizar y Aprobar Proyecto"
      >
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs leading-relaxed font-medium italic">
            Al finalizar un proyecto, este se marcará como <strong>COMPLETADO</strong> y no podrá recibir más revisiones. Debe adjuntar el documento avalado.
          </p>
        </div>

        <form onSubmit={handleFinalize} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1 italic">Documento Final Avalado</label>
              {!finalFile ? (
                <div 
                  onClick={() => document.getElementById('final-file-input').click()}
                  className="border-2 border-dashed border-card-border rounded-xl p-8 text-center hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer transition-all"
                >
                  <FileText className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-foreground/40 italic">Adjuntar documento (.docx)</p>
                  <input 
                    id="final-file-input" 
                    type="file" 
                    className="hidden" 
                    accept=".doc,.docx" 
                    onChange={e => setFinalFile(e.target.files[0])} 
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-foreground font-medium truncate max-w-[250px]">{finalFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setFinalFile(null)} className="text-red-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFinalizeModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} variant="secondary" className="flex-1 font-bold tracking-widest italic">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'APROBAR PROYECTO'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


