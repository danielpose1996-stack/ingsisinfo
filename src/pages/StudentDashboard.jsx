import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerProyectosEstudiante, 
  obtenerDocentes, 
  crearProyecto, 
  subirDocumento, 
  obtenerNotificaciones,
  marcarNotificacionLeida,
  actualizarPerfil,
  eliminarProyecto,
  descargarArchivo
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { 
  User, 
  Folder, 
  CheckCircle, 
  Bell, 
  Plus, 
  FileText, 
  Download, 
  History, 
  MessageSquare,
  ChevronRight,
  Loader2,
  Upload,
  X,
  BookOpen,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentDashboard() {
  const { user, perfil, refreshPerfil } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [proyectos, setProyectos] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // Registration form state
  const [docentes, setDocentes] = useState([]);
  const [newProject, setNewProject] = useState({ nombre: '', estado: 'propuesta', docenteId: '', linea_investigacion: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Correction flow state
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionComment, setCorrectionComment] = useState('');
  const [correctionFile, setCorrectionFile] = useState(null);

  // Edit profile state
  const [editProfileData, setEditProfileData] = useState({
    nombre: '',
    apellido: '',
    semestre: '',
    linea_investigacion: ''
  });

  useEffect(() => {
    if (user && perfil) {
      loadInitialData();
    }
  }, [user, perfil]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [proys, notifs, docs] = await Promise.all([
        obtenerProyectosEstudiante(perfil.id),
        obtenerNotificaciones(perfil.id),
        obtenerDocentes()
      ]);
      setProyectos(proys);
      setNotificaciones(notifs);
      setDocentes(docs);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('Debes adjuntar el documento del proyecto');
    
    setIsSubmitting(true);
    try {
      const proyecto = await crearProyecto({
        nombre: sanitizeText(newProject.nombre),
        estado: newProject.estado,
        estudianteId: perfil.id,
        docenteId: newProject.docenteId,
        linea_investigacion: newProject.linea_investigacion
      });
      
      await subirDocumento(selectedFile, proyecto.id, perfil.id);
      
      setIsProjectModalOpen(false);
      setNewProject({ nombre: '', estado: 'propuesta', docenteId: '', linea_investigacion: '' });
      setSelectedFile(null);
      await loadInitialData();
    } catch (error) {
      alert('Error al crear el proyecto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsSubmitting(true);
    try {
      await eliminarProyecto(projectToDelete.id);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      await loadInitialData();
    } catch (error) {
      alert('Error al eliminar el proyecto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditProfile = () => {
    setEditProfileData({
      nombre: perfil.nombre || '',
      apellido: perfil.apellido || '',
      semestre: perfil.semestre || '',
      linea_investigacion: perfil.linea_investigacion || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await actualizarPerfil(user.id, {
        nombre: sanitizeText(editProfileData.nombre),
        apellido: sanitizeText(editProfileData.apellido),
        semestre: parseInt(editProfileData.semestre),
        linea_investigacion: editProfileData.linea_investigacion
      });
      await refreshPerfil();
      setIsEditProfileOpen(false);
      alert('Perfil actualizado con éxito');
    } catch (error) {
      alert('Error al actualizar perfil: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (proyecto) => {
    const version = proyecto.versiones_proyecto?.[proyecto.versiones_proyecto.length - 1];
    if (!version || !version.documento_url) {
      return alert('Este proyecto aún no tiene un documento registrado o la subida falló anteriormente.');
    }
    descargarArchivo(version.documento_url, version.nombre_archivo);
  };

  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!correctionFile) return;
    
    setIsSubmitting(true);
    try {
      await subirDocumento(correctionFile, selectedProyecto.id, perfil.id, correctionComment);
      await loadInitialData();
      
      // Actualizar el proyecto seleccionado para mostrar la nueva versión
      const updatedProys = await obtenerProyectosEstudiante(perfil.id);
      setSelectedProyecto(updatedProys.find(p => p.id === selectedProyecto.id));
      
      setIsCorrectionModalOpen(false);
      setCorrectionComment('');
      setCorrectionFile(null);
      alert('Corrección subida con éxito');
    } catch (error) {
      alert('Error al subir corrección: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (estado) => {
    switch(estado) {
      case 'propuesta': return <Badge variant="blue">Propuesta</Badge>;
      case 'desarrollo': return <Badge variant="amber">En Desarrollo</Badge>;
      case 'aplicacion': return <Badge variant="emerald">Aplicación</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const handleMarkNotificationsRead = async () => {
    const unread = notificaciones.filter(n => !n.leida);
    if (unread.length === 0) return;
    
    try {
      await Promise.all(unread.map(n => marcarNotificacionLeida(n.id)));
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-card-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Estudiante</h1>
          <p className="text-foreground/60 font-medium italic">
            Hola, {perfil?.nombre} — <span className="text-emerald-500">{perfil?.carrera || 'Ingeniería Informática'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsNotificationsModalOpen(true);
              handleMarkNotificationsRead();
            }}
            className="relative p-3 rounded-xl bg-card hover:bg-emerald-500/10 border border-card-border transition-colors group z-10"
          >
            <Bell className="w-5 h-5 text-foreground/40 group-hover:text-emerald-500 pointer-events-none" />
            {notificaciones.filter(n => !n.leida).length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background pointer-events-none" />
            )}
          </button>
          <Button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-card border border-card-border rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('perfil')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'perfil' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-foreground/40 hover:text-foreground hover:bg-background'}`}
        >
          <User className="w-4 h-4" /> Mi Perfil
        </button>
        <button 
          onClick={() => setActiveTab('proyectos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'proyectos' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-foreground/40 hover:text-foreground hover:bg-background'}`}
        >
          <Folder className="w-4 h-4" /> En Desarrollo
        </button>
        <button 
          onClick={() => setActiveTab('completados')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'completados' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-foreground/40 hover:text-foreground hover:bg-background'}`}
        >
          <CheckCircle className="w-4 h-4" /> Completados
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'perfil' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <GlassCard className="lg:col-span-2 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2 italic">
                    <User className="w-5 h-5 text-emerald-400" /> Información Personal
                  </h3>
                  <Button variant="outline" size="sm" onClick={openEditProfile}>
                    Editar Perfil
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Nombre Completo</p>
                    <p className="text-foreground font-medium">{perfil?.nombre} {perfil?.apellido}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Correo Electrónico</p>
                    <p className="text-foreground font-medium">{perfil?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Carrera</p>
                    <p className="text-foreground font-medium">{perfil?.carrera || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Semestre / Línea</p>
                    <p className="text-foreground font-medium">
                      {perfil?.semestre ? `${perfil.semestre}° Semestre` : '—'} 
                      {perfil?.linea_investigacion ? ` / ${perfil.linea_investigacion}` : ''}
                    </p>
                  </div>
                </div>
              </GlassCard>

              <div className="space-y-6">
                <GlassCard className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                  <h4 className="text-foreground font-bold mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-500" /> Resumen de Actividad
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground/60">Proyectos registrados</span>
                      <span className="text-foreground font-bold">{proyectos.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground/60">Revisiones recibidas</span>
                      <span className="text-foreground font-bold">
                        {proyectos.reduce((acc, p) => acc + (p.numero_revisiones || 0), 0)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-6">
                   <h4 className="text-foreground font-bold mb-4">🔔 Notificaciones</h4>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {notificaciones.length > 0 ? (
                       notificaciones.map(n => (
                         <div key={n.id} className={`p-3 rounded-lg text-xs leading-relaxed ${n.leida ? 'bg-card text-foreground/40 border border-card-border' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'}`}>
                           {n.mensaje}
                         </div>
                       ))
                     ) : (
                       <p className="text-foreground/40 text-xs italic text-center py-4">Sin notificaciones nuevas</p>
                     )}
                   </div>
                </GlassCard>
              </div>
            </div>
          )}

          {activeTab === 'proyectos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proyectos.filter(p => !p.terminado).length > 0 ? (
                proyectos.filter(p => !p.terminado).map(p => (
                  <GlassCard key={p.id} hover className="p-0 overflow-hidden flex flex-col cursor-pointer group" onClick={() => setSelectedProyecto(p)}>
                    <div className="p-5 flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        {getStatusBadge(p.estado)}
                        <div className="flex items-center gap-2">
                          {(p.estado === 'propuesta' || p.estado === 'desarrollo') && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setProjectToDelete(p); setIsDeleteModalOpen(true); }}
                              className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar proyecto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <span className="text-[10px] text-foreground/40 font-mono">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-3 group-hover:text-emerald-500 transition-colors line-clamp-2 italic uppercase tracking-tight">
                        {p.nombre}
                      </h4>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <User className="w-3 h-3 text-emerald-500" /> Asesor: {p.docente?.nombre} {p.docente?.apellido}
                        </div>
                        {p.linea_investigacion && (
                          <div className="flex items-center gap-2 text-xs text-emerald-400/80">
                            <BookOpen className="w-3 h-3" /> Línea: {p.linea_investigacion}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <History className="w-3 h-3" /> {p.numero_revisiones} revisiones realizadas
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-card border-t border-card-border flex items-center justify-between">
                      <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter italic">Ver detalles del seguimiento</span>
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                    </div>
                  </GlassCard>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto">
                    <Folder className="w-10 h-10 text-gray-700" />
                  </div>
                  <p className="text-gray-500 italic">No tienes proyectos en desarrollo actualmente.</p>
                  <Button variant="outline" onClick={() => setIsProjectModalOpen(true)}>Registrar mi primer proyecto</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'completados' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proyectos.filter(p => p.terminado).length > 0 ? (
                proyectos.filter(p => p.terminado).map(p => (
                  <GlassCard key={p.id} className="p-6 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                      <h4 className="text-lg font-bold text-foreground italic uppercase tracking-tight">{p.nombre}</h4>
                    </div>
                    <div className="space-y-2 mb-4">
                      {p.linea_investigacion && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium flex items-center gap-1.5 mb-1.5">
                           <BookOpen className="w-3 h-3" /> Línea: {p.linea_investigacion}
                        </p>
                      )}
                      <p className="text-xs text-foreground/60">Completado bajo la tutoría de {p.docente?.nombre}</p>
                      <p className="text-[10px] text-foreground/40 font-medium italic">Finalizado el: {new Date(p.updated_at).toLocaleDateString()}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => handleDownload(p)}
                    >
                       <Download className="w-4 h-4" /> Descargar Acta Final
                    </Button>
                  </GlassCard>
                ))
              ) : (
                <p className="col-span-full py-20 text-center text-gray-500 italic">No tienes proyectos finalizados aún. ¡Sigue trabajando en tus investigaciones!</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* --- MODALS --- */}

      {/* New Project Modal */}
      <Modal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)}
        title="Registro de Nuevo Proyecto"
      >
        <form onSubmit={handleCreateProject} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1 italic">Nombre del Proyecto</label>
              <input 
                type="text" 
                required
                value={newProject.nombre}
                onChange={e => setNewProject({...newProject, nombre: e.target.value})}
                placeholder="Ej: Desarrollo de un Sistema de IA..."
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all font-medium italic"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Estado Inicial</label>
                <select 
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50"
                  value={newProject.estado}
                  onChange={e => setNewProject({...newProject, estado: e.target.value})}
                >
                  <option value="propuesta" className="bg-background">Propuesta</option>
                  <option value="desarrollo" className="bg-background">Desarrollo</option>
                  <option value="aplicacion" className="bg-background">Aplicación</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Asesor Asignado</label>
                <select 
                  required
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50"
                  value={newProject.docenteId}
                  onChange={e => setNewProject({...newProject, docenteId: e.target.value})}
                >
                  <option value="" className="bg-background">Seleccionar...</option>
                  {docentes.map(d => (
                    <option key={d.id} value={d.id} className="bg-background">{d.nombre} {d.apellido}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Línea de Investigación</label>
              <select 
                required
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50"
                value={newProject.linea_investigacion}
                onChange={e => setNewProject({...newProject, linea_investigacion: e.target.value})}
              >
                <option value="" className="bg-background">Seleccione una línea...</option>
                <option value="Ingeniería de Software" className="bg-background">Ingeniería de Software</option>
                <option value="Robótica" className="bg-background">Robótica</option>
                <option value="Ingeniería del Conocimiento" className="bg-background">Ingeniería del Conocimiento</option>
                <option value="Redes y Telemática" className="bg-background">Redes y Telemática</option>
                <option value="Gestión de la Seguridad Informática" className="bg-background">Gestión de la Seguridad Informática</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1 italic">Documento Base</label>
              {!selectedFile ? (
                <div 
                  onClick={() => document.getElementById('file-input').click()}
                  className="mt-1 border-2 border-dashed border-card-border rounded-xl p-8 text-center hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer transition-all"
                >
                  <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 italic">Haz clic para subir o arrastra el archivo</p>
                  <p className="text-[10px] text-gray-600 mt-2">Solo archivos .doc, .docx (Máx 20MB)</p>
                  <input id="file-input" type="file" className="hidden" accept=".doc,.docx" onChange={e => setSelectedFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm text-foreground font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsProjectModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 font-bold tracking-widest italic p-3">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'REGISTRAR PROYECTO'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Project Detail Modal */}
      <Modal 
        isOpen={!!selectedProyecto} 
        onClose={() => setSelectedProyecto(null)}
        title="Seguimiento de Proyecto"
      >
        {selectedProyecto && (
          <div className="space-y-6">
            <div className="p-4 bg-card rounded-xl border border-card-border">
              <h4 className="text-foreground font-bold italic mb-4 uppercase tracking-tight">{selectedProyecto.nombre}</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-foreground/40 font-bold mb-1 italic">DOCENTE</p>
                  <p className="text-foreground font-medium">{selectedProyecto.docente?.nombre} {selectedProyecto.docente?.apellido}</p>
                </div>
                <div>
                  <p className="text-foreground/40 font-bold mb-1 italic">ESTADO</p>
                  <p className="text-emerald-500 font-bold uppercase">{selectedProyecto.estado.toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                <History className="w-4 h-4" /> Historial de Versiones
              </h5>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedProyecto.versiones_proyecto?.length > 0 ? (
                  [...selectedProyecto.versiones_proyecto].reverse().map((v, idx) => (
                    <div key={v.id} className="p-3 bg-card rounded-xl border border-card-border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest italic">Versión {v.version || (selectedProyecto.versiones_proyecto.length - idx)}</span>
                        <span className="text-[10px] text-foreground/40 font-medium">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-foreground font-medium italic mb-2">{v.nombre_archivo}</p>
                      {v.comentario_estudiante && (
                        <div className="mt-2 text-[10px] text-foreground/60 bg-background/50 p-2 rounded-lg italic border border-card-border">
                          " {v.comentario_estudiante} "
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-foreground/40 italic">No hay versiones registradas.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Observaciones del Tutor
              </h5>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedProyecto.observaciones?.length > 0 ? (
                  [...selectedProyecto.observaciones].reverse().map(o => (
                    <div key={o.id} className="p-4 bg-card rounded-xl border-l-4 border-amber-500/50 border border-card-border">
                      <p className="text-xs text-foreground/80 leading-relaxed mb-2 font-medium italic">{o.texto}</p>
                      <p className="text-[10px] text-foreground/40 flex justify-between font-bold uppercase tracking-widest">
                        <span>{new Date(o.created_at).toLocaleDateString()}</span>
                        <span>Docente Asesor</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-foreground/40 italic">No hay observaciones registradas aún.</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 gap-2 py-3"
                onClick={() => handleDownload(selectedProyecto)}
              >
                <Download className="w-4 h-4" /> Ver Documento
              </Button>
              
              <Button 
                variant="secondary" 
                className="flex-1 gap-2 py-3"
                disabled={isSubmitting}
                onClick={() => setIsCorrectionModalOpen(true)}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Subir Corrección
              </Button>
              
              <input 
                id="new-version-input" 
                type="file" 
                className="hidden" 
                accept=".doc,.docx" 
                onChange={e => handleUploadVersion(e.target.files[0], selectedProyecto.id)} 
              />
            </div>
          </div>
        )}
      </Modal>

       <Modal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)}
        title="Editar Perfil Académico"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Nombre</label>
              <input 
                type="text" 
                required
                value={editProfileData.nombre}
                onChange={e => setEditProfileData({...editProfileData, nombre: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all font-medium italic"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Apellido</label>
              <input 
                type="text" 
                required
                value={editProfileData.apellido}
                onChange={e => setEditProfileData({...editProfileData, apellido: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all font-medium italic"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Correo (No editable)</label>
            <input 
              type="text" 
              disabled
              value={perfil?.email}
              className="w-full bg-card/50 border border-card-border rounded-xl py-3 px-4 text-sm text-foreground/40 cursor-not-allowed font-medium italic"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Carrera (No editable)</label>
            <input 
              type="text" 
              disabled
              value={perfil?.carrera}
              className="w-full bg-card/50 border border-card-border rounded-xl py-3 px-4 text-sm text-foreground/40 cursor-not-allowed font-medium italic"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Semestre</label>
              <input 
                type="number" 
                min="1"
                max="12"
                required
                value={editProfileData.semestre}
                onChange={e => setEditProfileData({...editProfileData, semestre: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all font-medium italic"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Línea de Investigación</label>
              <select 
                required
                value={editProfileData.linea_investigacion}
                onChange={e => setEditProfileData({...editProfileData, linea_investigacion: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all font-medium italic"
              >
                <option value="Ingeniería de Software" className="bg-background">Ingeniería de Software</option>
                <option value="Robótica" className="bg-background">Robótica</option>
                <option value="Ingeniería del Conocimiento" className="bg-background">Ingeniería del Conocimiento</option>
                <option value="Redes y Telemática" className="bg-background">Redes y Telemática</option>
                <option value="Gestión de la Seguridad Informática" className="bg-background">Gestión de la Seguridad Informática</option>
                <option value="Inteligencia Artificial" className="bg-background">Inteligencia Artificial</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4 mt-6 border-t border-card-border pt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditProfileOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 font-bold tracking-widest italic p-3">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'GUARDAR CAMBIOS'}
            </Button>
          </div>


        </form>
      </Modal>

      {/* Correction Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setCorrectionComment('');
          setCorrectionFile(null);
        }}
        title="Subir Corrección del Proyecto"
      >
        <form onSubmit={handleUploadVersion} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1 italic">Documento con cambios</label>
              {!correctionFile ? (
                <div 
                  onClick={() => document.getElementById('correction-file-input').click()}
                  className="border-2 border-dashed border-card-border rounded-xl p-8 text-center hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer transition-all"
                >
                  <Upload className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-foreground/40 italic">Adjuntar documento (.docx)</p>
                  <input 
                    id="correction-file-input" 
                    type="file" 
                    className="hidden" 
                    accept=".doc,.docx" 
                    onChange={e => setCorrectionFile(e.target.files[0])} 
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-foreground font-medium truncate max-w-[250px]">{correctionFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setCorrectionFile(null)} className="text-red-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 px-1 italic">Breve comentario / Respuesta a observaciones</label>
              <textarea 
                value={correctionComment}
                onChange={e => setCorrectionComment(e.target.value)}
                rows={4}
                placeholder="Ej: Ya apliqué los cambios en la sección de arquitectura..."
                className="w-full bg-card border border-card-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all font-medium italic resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCorrectionModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 font-bold tracking-widest italic p-3">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'ENVIAR CORRECCIÓN'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Proyecto"
      >
        <div className="space-y-6">
          <p className="text-sm text-foreground/80 leading-relaxed">
            ¿Estás seguro que deseas eliminar permanentemente el proyecto <span className="text-foreground font-bold italic">"{projectToDelete?.nombre}"</span>?<br/><br/>
            Esta acción <span className="text-red-600 dark:text-red-400 font-bold">no se puede deshacer</span> y borrará todo el historial, documentos y revisiones asociadas.
          </p>
          <div className="flex gap-4 pt-4 border-t border-card-border mt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <button 
              type="button" 
              disabled={isSubmitting} 
              onClick={handleDeleteProject} 
              className="flex-1 bg-red-500 hover:bg-red-600 text-foreground font-bold tracking-widest italic p-3 rounded-xl transition-colors flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ELIMINAR'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        title="Notificaciones"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {notificaciones.length > 0 ? (
            notificaciones.map(n => (
              <div key={n.id} className="p-4 rounded-xl bg-card border border-card-border text-sm leading-relaxed text-foreground/80">
                {n.mensaje}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-foreground/40 italic">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No tienes notificaciones recibidas.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function estadoLabel(estado) {
  return { propuesta: 'Propuesta', desarrollo: 'En Desarrollo', aplicacion: 'Aplicación' }[estado] || estado;
}

