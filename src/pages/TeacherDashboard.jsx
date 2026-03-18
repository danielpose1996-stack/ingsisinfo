import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerProyectosDocente, 
  enviarObservacion, 
  finalizarProyecto,
  subirDocumento,
  actualizarEstadoProyecto,
  descargarArchivo
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
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
  X
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

  useEffect(() => {
    if (user && perfil) {
      loadData();
    }
  }, [user, perfil]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await obtenerProyectosDocente(perfil.id);
      setProyectos(data);
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSendObservation = async (e) => {
    e.preventDefault();
    if (!observacion.trim()) return;
    
    setIsSubmitting(true);
    try {
      await enviarObservacion(selectedProyecto.id, perfil.id, sanitizeText(observacion));
      setIsObsModalOpen(false);
      setObservacion('');
      await loadData();
    } catch (error) {
      alert('Error al enviar observación: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!finalFile) return alert('Debes adjuntar el documento final');
    
    setIsSubmitting(true);
    try {
      // Finalizar proyecto subirá el documento y marcará como terminado
      await finalizarProyecto(selectedProyecto.id, finalFile, perfil.id);
      
      setIsFinalizeModalOpen(false);
      setFinalFile(null);
      setConfirmPass('');
      await loadData();
      alert('Proyecto finalizado y aprobado con éxito.');
    } catch (error) {
      alert('Error al finalizar proyecto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhaseChange = async (proyectoId, nuevoEstado) => {
    const confirmacion = window.confirm(`¿Estás seguro de que deseas cambiar la fase del proyecto a ${nuevoEstado.toUpperCase()}?`);
    if (!confirmacion) return;

    try {
      await actualizarEstadoProyecto(proyectoId, nuevoEstado);
      await loadData();
    } catch (error) {
      alert('Error al cambiar fase: ' + error.message);
    }
  };

  const handleDownload = (proyecto) => {
    const version = proyecto.versiones_proyecto?.[proyecto.versiones_proyecto.length - 1];
    if (!version || !version.documento_url) {
      return alert('Este proyecto aún no tiene un documento registrado o la subida falló anteriormente.');
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
        </div>
      </div>

      <AnimatePresence mode="wait">
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
                          return alert('El proyecto debe estar en fase de APLICACIÓN para ser aprobado.');
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
                <GlassCard key={p.id} className="border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
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
      </AnimatePresence>

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


