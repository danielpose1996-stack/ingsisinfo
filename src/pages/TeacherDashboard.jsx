import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerProyectosDocente, 
  enviarObservacion, 
  finalizarProyecto,
  subirDocumento,
  actualizarEstadoProyecto,
  descargarArchivo,
  obtenerModulos
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import OvaManagerView from '../components/OvaManagerView';
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
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherDashboard() {
  const { user, perfil } = useAuth();
  const [activeTab, setActiveTab] = useState('revision');
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado de modales
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  
  // Estado de acciones
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalFile, setFinalFile] = useState(null);
  const [confirmPass, setConfirmPass] = useState('');

  // Estado del Aula Virtual
  const [docenteModulo, setDocenteModulo] = useState(null);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  useEffect(() => {
    if (user && perfil && !hasLoadedInitial) {
      loadData();
    }
  }, [user, perfil, hasLoadedInitial]);

  async function loadData() {
    if (loading && hasLoadedInitial) return;
    
    setLoading(true);
    try {
      const data = await obtenerProyectosDocente(perfil.id);
      setProyectos(data || []);

      // Auto-detectar módulo para el Aula Virtual según la línea de investigación
      const modulos = await obtenerModulos();
      const match = (modulos || []).find(m => m.nombre === perfil.linea_investigacion);
      if (match) {
        setDocenteModulo(match);
      }
      setHasLoadedInitial(true);
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSendObservation = async (e) => {
    e.preventDefault();
    if (!observacion.trim() || !perfil?.id) return;
    
    setIsSubmitting(true);
    try {
      await enviarObservacion(selectedProyecto.id, perfil.id, sanitizeText(observacion));
      setIsObsModalOpen(false);
      setObservacion('');
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

  const handleFinalizeProject = async (e) => {
    e.preventDefault();
    if (!selectedProyecto || !finalFile) return;

    setIsSubmitting(true);
    try {
      const fileExt = finalFile.name.split('.').pop();
      const fileName = `final_${selectedProyecto.id}_${Date.now()}.${fileExt}`;
      const filePath = `proyectos_finales/${fileName}`;
      
      const fileUrl = await subirDocumento(finalFile, filePath);
      await finalizarProyecto(selectedProyecto.id, fileUrl);
      
      setIsFinalizeModalOpen(false);
      setFinalFile(null);
      await loadData();
      toast.success('Proyecto marcado como finalizado y publicado con éxito.');
    } catch (error) {
      console.error("Error al finalizar proyecto:", error);
      toast.error('Error al finalizar proyecto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (proyectoId, nuevoEstado) => {
    try {
      await actualizarEstadoProyecto(proyectoId, nuevoEstado);
      await loadData();
      toast.success(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al actualizar estado: " + error.message);
    }
  };

  if (loading && !hasLoadedInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A]" />
        <p className="text-foreground/40 text-sm italic font-mono uppercase tracking-widest">Cargando panel de docente...</p>
      </div>
    );
  }

  const pendientes = proyectos.filter(p => p.estado !== 'finalizado' && !p.terminado);
  const terminados = proyectos.filter(p => p.estado === 'finalizado' || p.terminado);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* ─── Encabezado del Perfil ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-card-border">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] text-[10px] font-black uppercase tracking-widest italic border border-[#1E3A8A]/20">
              Panel de Docente Asesor
            </span>
            <span className="text-foreground/40 text-xs italic font-mono">
              Línea: <strong className="text-foreground">{perfil?.linea_investigacion || 'No asignada'}</strong>
            </span>
          </div>
          <h1 className="text-4xl font-black text-foreground italic tracking-tight uppercase font-display">
            Prof. {perfil?.nombre} {perfil?.apellido}
          </h1>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex bg-card p-1.5 rounded-2xl border border-card-border self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('revision')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap italic ${
              activeTab === 'revision' 
                ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/20' 
                : 'text-foreground/60 hover:text-foreground hover:bg-card'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Proyectos ({pendientes.length})
          </button>
          <button
            onClick={() => setActiveTab('aula')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap italic ${
              activeTab === 'aula' 
                ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/20' 
                : 'text-foreground/60 hover:text-foreground hover:bg-card'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Aula Virtual (OVAs)
          </button>
        </div>
      </div>

      {/* ─── Pestaña de Revisión de Proyectos ─── */}
      <AnimatePresence mode="wait">
        {activeTab === 'revision' && (
          <motion.div
            key="revision"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {pendientes.length > 0 ? (
              pendientes.map((proyecto) => {
                const ultimaVersion = proyecto.versiones_proyecto?.[proyecto.versiones_proyecto.length - 1];
                return (
                  <GlassCard key={proyecto.id} className="p-6 flex flex-col justify-between border-card-border hover:border-[#1E3A8A]/30 transition-all duration-300">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-start">
                        <Badge variant="blue">{proyecto.estado.toUpperCase()}</Badge>
                        <span className="text-[10px] text-foreground/40 font-mono">
                          v{proyecto.versiones_proyecto?.length || 1}.0
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-foreground italic mb-2 line-clamp-2 uppercase">
                          {proyecto.nombre}
                        </h3>
                        <p className="text-xs text-foreground/60 line-clamp-3 leading-relaxed">
                          {proyecto.descripcion || 'Sin descripción detallada disponible.'}
                        </p>
                      </div>

                      <div className="p-3.5 bg-card/50 rounded-xl border border-card-border space-y-1.5 text-xs">
                        <p className="text-foreground/70">
                          <strong className="text-foreground/40 text-[9px] uppercase tracking-wider block font-mono">Estudiante:</strong>
                          {proyecto.estudiante?.nombre} {proyecto.estudiante?.apellido}
                        </p>
                        <p className="text-foreground/70">
                          <strong className="text-foreground/40 text-[9px] uppercase tracking-wider block font-mono">Correo Institucional:</strong>
                          {proyecto.estudiante?.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-card-border">
                      {ultimaVersion?.documento_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 text-xs italic"
                          onClick={() => descargarArchivo(ultimaVersion.documento_url, ultimaVersion.nombre_archivo)}
                        >
                          <Download className="w-4 h-4" /> Descargar Avance
                        </Button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-xs italic border border-card-border"
                          onClick={() => {
                            setSelectedProyecto(proyecto);
                            setIsObsModalOpen(true);
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Observar
                        </Button>
                        <Button
                          variant="emerald"
                          size="sm"
                          className="gap-2 text-xs italic"
                          onClick={() => {
                            setSelectedProyecto(proyecto);
                            setIsFinalizeModalOpen(true);
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Finalizar
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <div className="col-span-full py-24 text-center bg-card rounded-3xl border border-card-border">
                <Users className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground italic">Sin proyectos pendientes</h3>
                <p className="text-foreground/40 text-xs max-w-sm mx-auto mt-1">
                  No tienes proyectos asignados pendientes de revisión en este momento.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Pestaña de Aula Virtual (OVAs) ─── */}
      {activeTab === 'aula' && (
        <OvaManagerView modulo={docenteModulo} />
      )}

      {/* ─── Modal de Envío de Observaciones ─── */}
      <Modal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        title="Enviar Observaciones al Estudiante"
      >
        <form onSubmit={handleSendObservation} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              Comentarios y Correcciones
            </label>
            <textarea
              required
              rows={5}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Escribe las correcciones o retroalimentación para el estudiante..."
              className="w-full p-4 rounded-xl bg-card border border-card-border text-foreground text-sm focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-card-border">
            <Button variant="ghost" onClick={() => setIsObsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Send className="w-4 h-4" /> {isSubmitting ? 'Enviando...' : 'Enviar Observación'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal de Finalización de Proyecto ─── */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        title="Aprobar y Finalizar Proyecto"
      >
        <form onSubmit={handleFinalizeProject} className="space-y-6">
          <p className="text-xs text-foreground/70 leading-relaxed">
            Al finalizar este proyecto, se publicará en el Repositorio de la línea <strong>{perfil?.linea_investigacion}</strong>. Por favor sube el documento final definitivo.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              Documento Final (PDF)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFinalFile(e.target.files[0])}
              className="w-full text-xs text-foreground/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1E3A8A] file:text-white hover:file:bg-[#1E40AF]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-card-border">
            <Button variant="ghost" onClick={() => setIsFinalizeModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="emerald" disabled={isSubmitting} className="gap-2">
              <CheckCircle className="w-4 h-4" /> {isSubmitting ? 'Finalizando...' : 'Aprobar y Publicar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
