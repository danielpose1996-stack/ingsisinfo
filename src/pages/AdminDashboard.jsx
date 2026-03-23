import React, { useState, useEffect } from 'react';
import OvaEditor from './OvaEditor';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerEstadisticasAdmin, 
  obtenerTodosUsuarios, 
  obtenerTodosProyectos,
  obtenerModulos,
  obtenerNoticias,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia,
  obtenerEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  obtenerGaleria,
  crearGaleria,
  eliminarGaleria,
  eliminarUsuario,
  registrarUsuario,
  actualizarPerfil,
  descargarArchivo,
  obtenerOvasModulo,
  crearOva,
  actualizarOva,
  eliminarOva,
  subirArchivoOva,
  obtenerSeguimientoOvas,
  eliminarResultadoOva,
  eliminarTodoSeguimiento
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';
import { useEmailValidation } from '../hooks/useEmailValidation';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Settings,
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  FileCheck,
  Calendar,
  Image as ImageIcon,
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  List,
  PlusCircle,
  FileDown,
  Youtube,
  Globe,
  X,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to normalize strings for robust comparison (removes accents/spaces/case)
const normalize = (str) => {
  if (!str) return '';
  return str.toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export default function AdminDashboard() {
  const { user, perfil } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, pendingProjects: 0, totalFinalized: 0 });
  const [usuarios, setUsuarios] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [seguimientoOvas, setSeguimientoOvas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(false);

  // Public Content State (Inicio)
  const [noticiasAdmin, setNoticiasAdmin] = useState([]);
  const [eventosAdmin, setEventosAdmin] = useState([]);
  const [galeriaAdmin, setGaleriaAdmin] = useState([]);

  // Public Selection/Modal States
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);
  const [publicType, setPublicType] = useState('noticia'); // 'noticia', 'evento', 'galeria'
  const [editingPublicItem, setEditingPublicItem] = useState(null);
  const [publicForm, setPublicForm] = useState({});

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);

  // Aula Virtual / OVA State
  const [selectedModuloAula, setSelectedModuloAula] = useState(null);
  const [ovas, setOvas] = useState([]);
  const [isOvaFormOpen, setIsOvaFormOpen] = useState(false);
  const [loadingOvas, setLoadingOvas] = useState(false);
  const [editingOva, setEditingOva] = useState(null);
  const [ovaForm, setOvaForm] = useState({
    titulo: '',
    descripcion: '',
    imagen_portada: '',
    objetivo: '',
    introduccion: '',
    contenido: [], // [{titulo, contenido, recurso_url}]
    recursos: { pdf_url: '', youtube_url: '', link_externo: '' },
    actividad_final: '',
    estado: 'borrador'
  });
  const { email: emailVal, setEmail: setEmailVal, error: emailError, isValid: isEmailValid, handleChange: handleEmailChange, getNormalizedEmail } = useEmailValidation('');
  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido: '',
    password: '',
    rol: 'estudiante',
    linea_investigacion: '' // Usaremos el campo existente en DB
  });

  // Filtering states
  const [filterLinea, setFilterLinea] = useState('');
  const [filterFase, setFilterFase] = useState('');
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [filterUserRol, setFilterUserRol] = useState('');
  const [filterLineaSeguimiento, setFilterLineaSeguimiento] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState(null); // Usaremos el ID de perfil (PK) para mayor seguridad

  useEffect(() => {
    if (user && perfil?.rol === 'admin') {
      loadAdminData();
    }
  }, [user, perfil]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [users, proys, mods] = await Promise.all([
        obtenerTodosUsuarios(),
        obtenerTodosProyectos(),
        obtenerModulos()
      ]);
      
      if (!proys) {
        console.warn("obtenerTodosProyectos returned null");
        setProyectos([]);
      } else {
        setProyectos(proys);
      }
      
      setUsuarios(users || []);
      setModulos(mods || []);

      // Calculate basic stats
      const validProys = proys || [];
      const validUsers = users || [];
      
      setStats({
        totalUsers: validUsers.length,
        totalProjects: validProys.length,
        pendingProjects: validProys.filter(p => !p.terminado).length,
        totalFinalized: validProys.filter(p => p.terminado).length
      });
    } catch (error) {
      console.error("Error loading admin data:", error);
      alert("Error al cargar datos del servidor: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (id) => {
    if (confirm('¿Estás seguro de eliminar este usuario? Esta acción es irreversible.')) {
      try {
        await eliminarUsuario(id);
        await loadAdminData();
        alert('Usuario eliminado con éxito');
      } catch (error) {
        alert('Error al eliminar usuario: ' + error.message);
      }
    }
  };

  const handleEditClick = (u) => {
    setIsEditMode(true);
    setEditingProfileId(u.id); // Usamos ID de perfil (PK)
    setNewUser({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      password: '',
      rol: u.rol || 'estudiante',
      linea_investigacion: u.linea_investigacion || ''
    });
    setEmailVal(u.email || '');
    setIsUserModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isEmailValid) return;

    setIsCreating(true);
    try {
      const normalizedEmail = getNormalizedEmail();
      if (isEditMode) {
        // Lógica de actualización
        const updates = {
          nombre: sanitizeText(newUser.nombre),
          apellido: sanitizeText(newUser.apellido),
          email: normalizedEmail,
          rol: newUser.rol,
          linea_investigacion: newUser.rol === 'docente' ? (newUser.linea_investigacion || 'Ingeniería de Software') : null
        };

        // Si se ingresó una contraseña, la incluimos para actualizar Auth
        if (newUser.password) {
          updates.password = newUser.password;
        }

        await actualizarPerfil(editingProfileId, updates, true);
        alert('Usuario actualizado con éxito (Perfil y Credenciales).');
      } else {
        // Lógica de creación (existente)
        await registrarUsuario({ 
          ...newUser, 
          nombre: sanitizeText(newUser.nombre),
          apellido: sanitizeText(newUser.apellido),
          email: normalizedEmail 
        });

        alert('Usuario creado con éxito. Se ha enviado un correo de confirmación.');
      }

      setIsUserModalOpen(false);
      setNewUser({ nombre: '', apellido: '', password: '', rol: 'estudiante', linea_investigacion: '' });
      setEmailVal('');
      setIsEditMode(false);
      setEditingProfileId(null);
      await loadAdminData();
    } catch (error) {
      alert('Error en la operación: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const loadOvas = async (moduloId) => {
    setLoadingOvas(true);
    try {
      const data = await obtenerOvasModulo(moduloId);
      setOvas(data);
    } catch (error) {
      console.error("Error loading OVAs:", error);
    } finally {
      setLoadingOvas(false);
    }
  };

  const handleSelectModuloAula = (modulo) => {
    setSelectedModuloAula(modulo);
    loadOvas(modulo.id);
  };

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
      estado: 'borrador'
    });
    setIsOvaFormOpen(true);
  };

  const handleEditOva = (ova) => {
    setEditingOva(ova);
    // Parse evaluacion: try JSON from actividad_final, fallback to legacy text
    let evaluacion = { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 };
    if (ova.actividad_final) {
      try {
        const parsed = JSON.parse(ova.actividad_final);
        if (parsed && parsed.preguntas) {
          evaluacion = parsed;
        }
      } catch {
        // Legacy: actividad_final is plain text/HTML, not a quiz
        evaluacion.instrucciones = ova.actividad_final;
      }
    }
    setOvaForm({
      ...ova,
      contenido: (ova.contenido || []).map((s, i) => ({
        ...s,
        _id: s._id || `section-${Date.now()}-${i}`,
        tipo: s.tipo || 'texto',
      })),
      recursos: ova.recursos || { pdf_url: '', youtube_url: '', link_externo: '' },
      evaluacion,
    });
    setIsOvaFormOpen(true);
  };

  const handleSaveOva = async (e) => {
    if (e) e.preventDefault();
    if (!ovaForm.titulo || !ovaForm.objetivo || ovaForm.contenido.length === 0) {
      alert("Por favor completa los campos obligatorios (Título, Objetivo y al menos una sección)");
      return;
    }

    try {
      // Clean internal _id fields before saving to DB, but keep rich HTML content
      const cleanedContenido = ovaForm.contenido.map(({ _id, ...c }) => ({
        ...c,
        titulo: sanitizeText(c.titulo),
      }));

      // Serialize evaluacion (quiz) into actividad_final as JSON
      const evaluacionData = ovaForm.evaluacion || { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 };
      // Clean _id from questions before saving
      const cleanedEvaluacion = {
        ...evaluacionData,
        preguntas: (evaluacionData.preguntas || []).map(({ _id, ...q }) => ({
          ...q,
          _id: _id, // keep _id for quiz questions (needed for player keying)
        })),
      };

      const dataToSave = {
        titulo: sanitizeText(ovaForm.titulo),
        descripcion: sanitizeText(ovaForm.descripcion),
        imagen_portada: ovaForm.imagen_portada || '',
        objetivo: sanitizeText(ovaForm.objetivo),
        introduccion: ovaForm.introduccion || '',
        actividad_final: JSON.stringify(cleanedEvaluacion),
        contenido: cleanedContenido,
        recursos: ovaForm.recursos || {},
        estado: ovaForm.estado || 'borrador',
        modulo_id: selectedModuloAula.id
      };

      if (editingOva) {
        await actualizarOva(editingOva.id, dataToSave);
      } else {
        await crearOva(dataToSave);
      }

      setIsOvaFormOpen(false);
      loadOvas(selectedModuloAula.id);
    } catch (error) {
      console.error("Error saving OVA:", error);
      alert("Error al guardar OVA");
    }
  };

  const handleDeleteOva = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este OVA?")) return;
    try {
      await eliminarOva(id);
      loadOvas(selectedModuloAula.id);
    } catch (error) {
      console.error("Error deleting OVA:", error);
      alert("Error al eliminar OVA: " + error.message);
    }
  };

  const handleToggleOvaStatus = async (ova) => {
    const nuevoEstado = ova.estado === 'publicado' ? 'borrador' : 'publicado';
    try {
      await actualizarOva(ova.id, { estado: nuevoEstado });
      loadOvas(selectedModuloAula.id);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };



  const handleFileUpload = async (e, type, sectionIndex = -1) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await subirArchivoOva(file, type);
      if (type === 'portada') {
        setOvaForm({ ...ovaForm, imagen_portada: url });
      } else if (type === 'pdf') {
        setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, pdf_url: url } });
      } else if (type === 'seccion' && sectionIndex >= 0) {
        const newContenido = [...ovaForm.contenido];
        newContenido[sectionIndex].recurso_url = url;
        setOvaForm({ ...ovaForm, contenido: newContenido });
      } else if (type === 'seccion_imagen' && sectionIndex >= 0) {
        const newContenido = [...ovaForm.contenido];
        newContenido[sectionIndex].imagen_url = url;
        setOvaForm({ ...ovaForm, contenido: newContenido });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error al subir archivo");
    }
  };


  const navItems = [
    { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'proyectos', label: 'Proyectos', icon: FolderTree },
    { id: 'aula', label: 'Aula Virtual', icon: BookOpen },
    { id: 'seguimiento', label: 'Seguimiento', icon: TrendingUp },
    { id: 'publico', label: 'Inicio', icon: Settings },
  ];

  useEffect(() => {
    if (activeTab === 'seguimiento') {
      loadSeguimiento();
    } else if (activeTab === 'publico') {
      loadPublicData();
    }
  }, [activeTab]);

  async function loadPublicData() {
    setLoadingPublic(true);
    try {
      const [news, evts, gal] = await Promise.all([
        obtenerNoticias(),
        obtenerEventos(),
        obtenerGaleria()
      ]);
      setNoticiasAdmin(news);
      setEventosAdmin(evts);
      setGaleriaAdmin(gal);
    } catch (error) {
      console.error("Error loading public data:", error);
    } finally {
      setLoadingPublic(false);
    }
  }

  const handleOpenPublicModal = (type, item = null) => {
    setPublicType(type);
    setEditingPublicItem(item);
    if (item) {
      setPublicForm(item);
    } else {
      setPublicForm(
        type === 'noticia' ? { titulo: '', contenido: '', imagen_url: '', fecha: new Date().toISOString().split('T')[0] } :
        type === 'evento' ? { titulo: '', descripcion: '', fecha_evento: new Date().toISOString().split('T')[0], tipo: 'proximo', imagen_url: '' } :
        { titulo: '', imagen_url: '', evento_id: null }
      );
    }
    setIsPublicModalOpen(true);
  };

  const handleSavePublicItem = async (e) => {
    e.preventDefault();
    try {
      if (publicType === 'noticia') {
        if (editingPublicItem) await actualizarNoticia(editingPublicItem.id, publicForm);
        else await crearNoticia(publicForm);
      } else if (publicType === 'evento') {
        if (editingPublicItem) await actualizarEvento(editingPublicItem.id, publicForm);
        else await crearEvento(publicForm);
      } else if (publicType === 'galeria') {
        await crearGaleria(publicForm);
      }
      setIsPublicModalOpen(false);
      await loadPublicData();
      alert('Operación realizada con éxito');
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };

  const handleDeletePublicItem = async (type, id) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    try {
      if (type === 'noticia') await eliminarNoticia(id);
      else if (type === 'evento') await eliminarEvento(id);
      else if (type === 'galeria') await eliminarGaleria(id);
      await loadPublicData();
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const handlePublicFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await subirArchivoOva(file, 'web-publica'); // Usamos el mismo bucket pero carpeta diferente
      setPublicForm({ ...publicForm, [field]: url });
    } catch (error) {
      alert('Error al subir imagen');
    }
  };

  async function loadSeguimiento() {
    setLoading(true);
    try {
      const data = await obtenerSeguimientoOvas();
      setSeguimientoOvas(data);
    } catch (error) {
      console.error("Error loading seguimiento:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteSeguimiento = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro de seguimiento?')) return;
    try {
      await eliminarResultadoOva(id);
      await loadSeguimiento();
    } catch (error) {
      alert('Error al eliminar registro: ' + error.message);
    }
  };

  const handleDeleteAllSeguimiento = async () => {
    if (!confirm('🚨 ADVERTENCIA CRÍTICA: ¿Estás seguro de eliminar TODO el historial de seguimiento? Esta acción es irreversible y borrará el progreso de todos los estudiantes.')) return;
    if (!confirm('Por favor confirma una vez más que deseas realizar esta acción destructiva.')) return;
    
    try {
      await eliminarTodoSeguimiento();
      await loadSeguimiento();
      alert('Se ha limpiado todo el historial de seguimiento correctamente.');
    } catch (error) {
      alert('Error al limpiar seguimiento: ' + error.message);
    }
  };

  // Tracking filters
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [filterOva, setFilterOva] = useState('');

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-card border-r border-card-border p-6 space-y-8">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-foreground font-bold tracking-tight italic">SISINFO</h2>
            <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic">Management Console</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'text-foreground/40 hover:text-foreground hover:bg-background/80'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-10">
          <GlassCard className="p-4 bg-blue-500/5">
             <p className="text-[10px] text-foreground/40 font-bold uppercase mb-2 italic">Estado del Sistema</p>
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs text-foreground font-medium italic">Base de Datos Conectada</span>
             </div>
          </GlassCard>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2 italic">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-foreground/60 italic font-medium">Gestión administrativa centralizada del Semillero SISINFO.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Elementos eliminados por solicitud del usuario */}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GlassCard className="p-8 border-card-border hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <Users className="w-6 h-6 text-emerald-500" />
                      </div>
                      <Badge variant="emerald">+12%</Badge>
                    </div>
                    <p className="text-5xl font-black text-foreground italic mb-1 uppercase tracking-tighter">{stats.totalUsers}</p>
                    <p className="text-foreground/40 text-sm font-bold uppercase tracking-widest italic">Usuarios Activos</p>
                  </GlassCard>

                  <GlassCard className="p-8 border-card-border hover:border-blue-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <FolderTree className="w-6 h-6 text-blue-500" />
                      </div>
                      <Badge variant="blue">+5 este mes</Badge>
                    </div>
                    <p className="text-5xl font-black text-foreground italic mb-1 uppercase tracking-tighter">{stats.totalProjects}</p>
                    <p className="text-foreground/40 text-sm font-bold uppercase tracking-widest italic">Proyectos Totales</p>
                  </GlassCard>

                  <GlassCard className="p-8 border-card-border hover:border-amber-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                      </div>
                      <Badge variant="amber">Crítico</Badge>
                    </div>
                    <p className="text-5xl font-black text-foreground italic mb-1 uppercase tracking-tighter">{stats.pendingProjects}</p>
                    <p className="text-foreground/40 text-sm font-bold uppercase tracking-widest italic">En Revisión</p>
                  </GlassCard>

                  <GlassCard className="p-8 border-card-border hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                        <FileCheck className="w-6 h-6 text-indigo-500" />
                      </div>
                      <Badge variant="indigo">Completados</Badge>
                    </div>
                    <p className="text-5xl font-black text-foreground italic mb-1 uppercase tracking-tighter">{stats.totalFinalized}</p>
                    <p className="text-foreground/40 text-sm font-bold uppercase tracking-widest italic">Proyectos Finalizados</p>
                  </GlassCard>
                </div>

                {/* Recent Activity / Projects */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <GlassCard className="p-6">
                     <h3 className="text-xl font-bold text-foreground mb-6 italic flex items-center gap-2">
                       <FileCheck className="w-5 h-5 text-emerald-400" /> Últimos Proyectos
                     </h3>
                     <div className="space-y-4">
                       {proyectos.slice(0, 5).map(p => (
                         <div key={p.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-transparent hover:border-card-border transition-all group">
                           <div>
                             <h4 className="text-sm font-bold text-foreground italic mb-1">{p.nombre}</h4>
                             <p className="text-[10px] text-foreground/40 font-medium">Estudiante: {p.estudiante?.nombre} · {new Date(p.created_at).toLocaleDateString()}</p>
                           </div>
                           <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-400 transition-colors" />
                         </div>
                       ))}
                     </div>
                   </GlassCard>

                   <GlassCard className="p-6">
                     <h3 className="text-xl font-bold text-foreground mb-6 italic flex items-center gap-2">
                       <Users className="w-5 h-5 text-blue-400" /> Nuevos Estudiantes
                     </h3>
                     <div className="space-y-4">
                       {usuarios.filter(u => u.rol === 'estudiante').slice(0, 5).map(u => (
                         <div key={u.id} className="flex items-center gap-4 p-3 hover:bg-card rounded-xl transition-colors">
                           <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/10 text-xs italic">
                             {u.nombre[0]}
                           </div>
                           <div className="flex-1">
                             <h4 className="text-sm font-bold text-foreground italic">{u.nombre} {u.apellido}</h4>
                             <p className="text-[10px] text-foreground/40 font-medium">{u.carrera || 'Ing. Informática'}</p>
                           </div>
                           <Badge size="sm">{u.semestre || '1'}° Sem</Badge>
                         </div>
                       ))}
                     </div>
                   </GlassCard>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <GlassCard className="p-0 overflow-hidden border-card-border">
                <div className="p-6 border-b border-card-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchUserTerm}
                        onChange={(e) => setSearchUserTerm(e.target.value)}
                        className="bg-background border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 min-w-[320px] shadow-inner transition-all"
                      />
                    </div>
                    <select
                      value={filterUserRol}
                      onChange={(e) => setFilterUserRol(e.target.value)}
                      className="bg-background border border-card-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 outline-none italic shadow-sm transition-all"
                    >
                      <option value="">TODOS LOS ROLES</option>
                      <option value="admin">ADMINISTRADORES</option>
                      <option value="docente">DOCENTES</option>
                      <option value="estudiante">ESTUDIANTES</option>
                    </select>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsUserModalOpen(true)} className="italic font-bold tracking-widest px-6">
                    + AÑADIR USUARIO
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-background/50 border-b border-card-border">
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Usuario</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Rol</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Carrera / Línea</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Registro</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {(() => {
                        const filteredUsers = usuarios.filter(u => {
                          const fullName = `${u.nombre} ${u.apellido}`;
                          const term = normalize(searchUserTerm);
                          const matchesSearch = !term || 
                            normalize(fullName).includes(term) || 
                            normalize(u.email).includes(term);
                          
                          const matchesRol = !filterUserRol || u.rol === filterUserRol;
                          
                          return matchesSearch && matchesRol;
                        });

                        if (filteredUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" className="px-6 py-20 text-center text-foreground/30 italic">
                                No se encontraron usuarios que coincidan con la búsqueda.
                              </td>
                            </tr>
                          );
                        }

                        return filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-background/40 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-xs font-bold text-emerald-500 border border-card-border italic shadow-sm group-hover:scale-105 transition-transform">
                                {u.nombre[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground italic tracking-tight">{u.nombre} {u.apellido}</p>
                                <p className="text-[10px] text-foreground/40 font-medium">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 border-0">
                            <Badge variant={u.rol === 'admin' ? 'red' : u.rol === 'docente' ? 'blue' : 'amber'}>
                              {u.rol?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-5 text-sm text-foreground/60 font-medium italic">
                            {u.rol === 'docente' ? u.linea_investigacion : u.carrera || '—'}
                          </td>
                          <td className="px-6 py-5 text-xs text-foreground/40 font-mono italic">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditClick(u)}
                                className="p-2 rounded-lg bg-card hover:bg-emerald-500/10 text-foreground/40 hover:text-emerald-500 border border-card-border"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-foreground/40 hover:text-red-500 border border-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {activeTab === 'proyectos' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
                  <div className="flex flex-wrap gap-4 flex-1">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] text-foreground/40 font-bold uppercase mb-1.5 ml-1 italic">Filtrar por Línea</label>
                      <select
                        value={filterLinea}
                        className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 italic shadow-sm transition-all"
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

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] text-foreground/40 font-bold uppercase mb-1.5 ml-1 italic">Filtrar por Fase</label>
                      <select
                        value={filterFase}
                        className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 italic shadow-sm transition-all"
                        onChange={(e) => setFilterFase(e.target.value)}
                      >
                        <option value="">Todas las Fases</option>
                        <option value="propuesta">Propuesta</option>
                        <option value="desarrollo">Desarrollo</option>
                        <option value="aplicacion">Aplicación</option>
                      </select>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => loadAdminData()} 
                    className="gap-2 italic py-3 px-6 h-[46px] border-emerald-500/10 hover:bg-emerald-500/5"
                    disabled={loading}
                  >
                    <TrendingUp className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    ACTUALIZAR
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const filteredProyectos = proyectos
                      .filter(p => !filterLinea || normalize(p.linea_investigacion) === normalize(filterLinea))
                      .filter(p => !filterFase || normalize(p.estado) === normalize(filterFase));

                    if (filteredProyectos.length === 0) {
                      return (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-6 bg-card/50 border border-dashed border-card-border rounded-3xl animate-in fade-in duration-700">
                          <div className="p-4 rounded-2xl bg-background/50 border border-card-border">
                             <FolderTree className="w-10 h-10 text-foreground/20" />
                          </div>
                          <div className="space-y-2 text-center">
                            <h3 className="text-lg font-bold text-foreground italic">No se encontraron proyectos</h3>
                            <p className="text-sm text-foreground/40 italic max-w-xs mx-auto">
                              Intenta cambiar los filtros o verifica los permisos en Supabase si crees que deberían aparecer más registros.
                            </p>
                          </div>
                          <Button variant="secondary" onClick={() => { setFilterFase(''); setFilterLinea(''); }} className="text-[10px] py-2 px-6">
                            LIMPIAR FILTROS
                          </Button>
                        </div>
                      );
                    }

                    return filteredProyectos.map(p => (
                    <GlassCard key={p.id} className="p-6 space-y-4">
                      <div className="flex flex-wrap gap-2 justify-between items-start">
                        <div className="flex gap-2">
                          <Badge variant={p.terminado ? 'emerald' : 'blue'}>{p.terminado ? 'Terminado' : 'En Proceso'}</Badge>
                          <Badge variant={p.estado === 'aplicacion' ? 'indigo' : p.estado === 'desarrollo' ? 'amber' : 'blue'}>
                            {p.estado?.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-foreground/40 font-mono italic">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground italic line-clamp-2">{p.nombre}</h4>
                      <div className="pt-4 border-t border-card-border space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground/40 font-bold uppercase tracking-tighter italic">Línea</span>
                          <span className="text-foreground font-medium italic">{p.linea_investigacion || 'No asignada'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground/40 font-bold uppercase tracking-tighter italic">Estudiante</span>
                          <span className="text-foreground font-medium">{p.estudiante?.nombre} {p.estudiante?.apellido}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground/40 font-bold uppercase tracking-tighter italic">Asesor</span>
                          <span className="text-foreground font-medium">{p.docente ? `${p.docente.nombre} ${p.docente.apellido}` : 'Pendiente'}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-card-border flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[10px] italic py-2"
                          onClick={() => {
                            const lastVersion = p.versiones_proyecto?.[p.versiones_proyecto.length - 1];
                            if (lastVersion?.documento_url) {
                              descargarArchivo(lastVersion.documento_url, lastVersion.nombre_archivo);
                            }
                          }}
                        >
                          DOC <Download className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-[10px] italic py-2"
                          onClick={() => {
                            setSelectedProyecto(p);
                            setIsProyectoModalOpen(true);
                          }}
                        >
                          EXPEDIENTE <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </GlassCard>
                    ));
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'aula' && (
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                 <GlassCard className="lg:col-span-1 p-6 space-y-4 h-fit border-card-border">
                   <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest italic mb-6">Módulos de Aprendizaje</h3>
                   {modulos.map(m => (
                     <button
                       key={m.id}
                       onClick={() => handleSelectModuloAula(m)}
                       className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-left group ${selectedModuloAula?.id === m.id ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'hover:bg-background/80 text-foreground/40 hover:text-emerald-500 border border-transparent'}`}
                     >
                       <span className="text-sm font-bold italic">{m.nombre}</span>
                       <ChevronRight className={`w-4 h-4 transition-transform ${selectedModuloAula?.id === m.id ? 'rotate-90 text-emerald-500' : 'opacity-0 group-hover:opacity-100'}`} />
                     </button>
                   ))}
                 </GlassCard>

                 <div className="lg:col-span-3 space-y-6">
                   {!selectedModuloAula ? (
                     <GlassCard className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                       <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center text-gray-600">
                         <BookOpen className="w-8 h-8" />
                       </div>
                       <h3 className="text-xl font-bold text-foreground italic">Gestión de Contenidos Aula Virtual</h3>
                       <p className="text-foreground/40 italic max-w-sm leading-relaxed">
                         Selecciona una línea de aprendizaje a la izquierda para administrar sus OVAs (Objetos Virtuales de Aprendizaje).
                       </p>
                     </GlassCard>
                   ) : isOvaFormOpen ? (
                      <OvaEditor
                        ovaForm={ovaForm}
                        setOvaForm={setOvaForm}
                        editingOva={editingOva}
                        onSave={handleSaveOva}
                        onCancel={() => setIsOvaFormOpen(false)}
                        onFileUpload={handleFileUpload}
                      />
                   ) : (
                     <div className="space-y-6">
                       {/* LIST OF OVAs */}
                       <div className="flex items-center justify-between mb-2">
                         <div>
                            <h3 className="text-2xl font-black text-foreground italic tracking-tight uppercase">
                              {selectedModuloAula.nombre}
                            </h3>
                            <p className="text-xs text-foreground/40 italic font-mono uppercase tracking-widest">Gestión de Objetos Virtuales de Aprendizaje</p>
                         </div>
                         <Button onClick={handleCreateOva} className="gap-2 italic py-3 px-8 text-xs font-black tracking-[0.2em]">
                           <Plus className="w-4 h-4" /> CREAR OVA
                         </Button>
                       </div>

                       {loadingOvas ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map(i => <div key={i} className="h-64 rounded-3xl bg-card animate-pulse" />)}
                         </div>
                       ) : ovas.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {ovas.map(ova => (
                             <GlassCard key={ova.id} className="p-6 border-card-border group hover:border-emerald-500/30 transition-all duration-500">
                               <div className="flex justify-between items-start mb-6">
                                 <Badge variant={ova.estado === 'publicado' ? 'emerald' : 'amber'}>
                                   {ova.estado?.toUpperCase()}
                                 </Badge>
                                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button
                                     onClick={() => handleToggleOvaStatus(ova)}
                                     title={ova.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
                                     className="p-2 rounded-lg bg-card hover:bg-white/10 text-foreground/60 hover:text-emerald-400"
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

                               <h4 className="text-lg font-bold text-foreground italic mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-emerald-400 transition-colors tracking-tight leading-tight">
                                 {ova.titulo}
                               </h4>

                               <div className="space-y-4 pt-4 border-t border-card-border">
                                 <div className="flex items-center justify-between text-[10px]">
                                   <span className="text-foreground/40 font-bold uppercase tracking-widest italic font-mono">Última Modificación</span>
                                   <span className="text-foreground/60">{new Date(ova.updated_at).toLocaleDateString()}</span>
                                 </div>
                                 <div className="flex items-center justify-between text-[10px]">
                                   <span className="text-foreground/40 font-bold uppercase tracking-widest italic font-mono">Secciones</span>
                                   <span className="text-foreground font-black">{ova.contenido?.length || 0}</span>
                                 </div>
                               </div>
                             </GlassCard>
                           ))}
                         </div>
                       ) : (
                         <GlassCard className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-card/10 border-dashed">
                           <BookOpen className="w-12 h-12 text-gray-800 opacity-30" />
                           <p className="text-foreground/40 italic max-w-xs uppercase tracking-widest text-[10px] font-bold">
                             No hay OVAs registrados para este módulo
                           </p>
                           <Button onClick={handleCreateOva} variant="outline" className="text-[10px] py-2">
                             EMPEZAR PRIMERA PLANIFICACIÓN
                           </Button>
                         </GlassCard>
                       )}
                     </div>
                   )}
                 </div>
               </div>
            )}

            {activeTab === 'publico' && (
              <div className="space-y-12 pb-20">
                {loadingPublic ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                  </div>
                ) : (
                  <>
                    <section>
                      <div className="flex items-center justify-between mb-8 border-b border-card-border pb-4">
                        <h3 className="text-2xl font-bold flex items-center gap-3 italic">
                          <span className="w-2 h-8 bg-emerald-500 rounded-full" />
                          📰 Noticias y Novedades
                        </h3>
                        <Button size="sm" onClick={() => handleOpenPublicModal('noticia')}>+ Redactar Noticia</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {noticiasAdmin.map(n => (
                          <GlassCard key={n.id} className="p-4 border-card-border group hover:border-emerald-500/30 transition-all">
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-card">
                              {n.imagen_url ? (
                                <img 
                                  src={n.imagen_url} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = ''; // Clear src to prevent broken image icon
                                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-foreground/10"><ImageIcon className="w-12 h-12" /></div>';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-foreground/10">
                                  <ImageIcon className="w-12 h-12" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenPublicModal('noticia', n)} className="p-2 rounded-lg bg-black/60 text-white hover:bg-emerald-500 transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeletePublicItem('noticia', n.id)} className="p-2 rounded-lg bg-black/60 text-white hover:bg-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-bold text-foreground italic mb-1 line-clamp-1">{n.titulo}</h4>
                            <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic">{new Date(n.fecha).toLocaleDateString()}</p>
                          </GlassCard>
                        ))}
                        {noticiasAdmin.length === 0 && (
                          <div className="col-span-full py-10 text-center text-foreground/30 italic bg-card border border-dashed border-card-border rounded-2xl">
                            No hay noticias publicadas.
                          </div>
                        )}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-8 border-b border-card-border pb-4">
                        <h3 className="text-2xl font-bold flex items-center gap-3 italic">
                          <span className="w-2 h-8 bg-blue-500 rounded-full" />
                          📅 Eventos Semilleristas
                        </h3>
                        <Button size="sm" onClick={() => handleOpenPublicModal('evento')}>+ Agendar Evento</Button>
                      </div>
                      <div className="space-y-4">
                        {eventosAdmin.map(e => (
                          <div key={e.id} className="flex items-center justify-between p-5 bg-card rounded-2xl border border-card-border group hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                                <span className="text-xs font-black uppercase tracking-tighter italic">{new Date(e.fecha_evento).toLocaleString('es', { month: 'short' })}</span>
                                <span className="text-xl font-black leading-none">{new Date(e.fecha_evento).getDate()}</span>
                              </div>
                              {e.imagen_url && (
                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-card-border">
                                  <img src={e.imagen_url} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-foreground italic">{e.titulo}</h4>
                                <p className="text-xs text-foreground/40 italic">{e.descripcion?.substring(0, 100)}...</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="blue" size="sm" className="italic">{e.tipo?.toUpperCase()}</Badge>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenPublicModal('evento', e)} className="p-2 rounded-lg bg-card hover:bg-blue-500/10 text-foreground/40 hover:text-blue-500 transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeletePublicItem('evento', e.id)} className="p-2 rounded-lg bg-card hover:bg-red-500/10 text-foreground/40 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {eventosAdmin.length === 0 && (
                          <p className="text-foreground/40 italic py-10 text-center bg-card rounded-2xl border border-dashed border-card-border">
                            No hay eventos programados.
                          </p>
                        )}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-8 border-b border-card-border pb-4">
                        <h3 className="text-2xl font-bold flex items-center gap-3 italic">
                          <span className="w-2 h-8 bg-amber-500 rounded-full" />
                          📸 Galería de Galería
                        </h3>
                        <Button size="sm" onClick={() => handleOpenPublicModal('galeria')}>+ Añadir a Galería</Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {galeriaAdmin.map(g => (
                          <div key={g.id} className="relative aspect-square rounded-xl overflow-hidden border border-card-border group">
                            <img src={g.imagen_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                               <button onClick={() => handleDeletePublicItem('galeria', g.id)} className="p-2 rounded-xl bg-red-500 text-white shadow-lg">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                        ))}
                        {galeriaAdmin.length === 0 && (
                          <div className="col-span-full py-12 text-center text-foreground/30 italic bg-card border border-dashed border-card-border rounded-2xl">
                            La galería está vacía.
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}
            {activeTab === 'seguimiento' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input
                        type="text"
                        placeholder="Buscar estudiante..."
                        value={searchEstudiante}
                        onChange={(e) => setSearchEstudiante(e.target.value)}
                        className="bg-card border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-emerald-500/50 min-w-[280px] outline-none italic transition-all"
                      />
                    </div>
                    <select
                      className="bg-background border border-card-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:border-emerald-500/50 outline-none italic shadow-sm transition-all"
                      value={filterOva}
                      onChange={(e) => setFilterOva(e.target.value)}
                    >
                      <option value="">Todas las OVAs</option>
                      {[...new Set(seguimientoOvas.map(s => s.ova?.titulo))].filter(Boolean).map(titulo => (
                        <option key={titulo} value={titulo}>{titulo}</option>
                      ))}
                    </select>
                    <select
                      className="bg-background border border-card-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:border-emerald-500/50 outline-none italic shadow-sm transition-all"
                      value={filterLineaSeguimiento}
                      onChange={(e) => setFilterLineaSeguimiento(e.target.value)}
                    >
                      <option value="">Todas las Líneas</option>
                      {[...new Set(modulos.map(m => m.nombre))].filter(Boolean).map(nombre => (
                        <option key={nombre} value={nombre}>{nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDeleteAllSeguimiento} 
                      className="gap-2 italic text-[10px] tracking-widest font-black text-red-500 hover:bg-red-500/10 border-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" /> LIMPIAR TODO
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadSeguimiento} className="gap-2 italic text-[10px] tracking-widest font-black">
                      <TrendingUp className="w-3 h-3" /> ACTUALIZAR DATOS
                    </Button>
                  </div>
                </div>

                {/* Metrics Highlight */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <GlassCard className="p-6 border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <FileCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-foreground italic leading-none">
                          {(() => {
                            const filtered = seguimientoOvas.filter(s => {
                              const matchSearch = (s.perfil?.nombre + ' ' + s.perfil?.apellido).toLowerCase().includes(searchEstudiante.toLowerCase()) || 
                                                s.perfil?.email.toLowerCase().includes(searchEstudiante.toLowerCase());
                              const matchOva = !filterOva || s.ova?.titulo === filterOva;
                              const matchLinea = !filterLineaSeguimiento || s.ova?.modulos?.nombre === filterLineaSeguimiento;
                              return matchSearch && matchOva && matchLinea;
                            });
                            return new Set(filtered.filter(s => s.completado).map(s => s.perfil?.id)).size;
                          })()}
                        </p>
                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic mt-1">Usuarios Completados</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <GlassCard className="p-0 overflow-hidden border-card-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-card/50 border-b border-card-border">
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Estudiante / Usuario</th>
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">OVA / Módulo</th>
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-center">Intentos</th>
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-center">Puntaje Máximo</th>
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-center">Última Nota</th>
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-center">Estado</th>
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-right">Actualización</th>
                          <th className="px-6 py-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {seguimientoOvas
                          .filter(s => {
                            const matchSearch = (s.perfil?.nombre + ' ' + s.perfil?.apellido).toLowerCase().includes(searchEstudiante.toLowerCase()) || 
                                              s.perfil?.email.toLowerCase().includes(searchEstudiante.toLowerCase());
                            const matchOva = !filterOva || s.ova?.titulo === filterOva;
                            const matchLinea = !filterLineaSeguimiento || s.ova?.modulos?.nombre === filterLineaSeguimiento;
                            return matchSearch && matchOva && matchLinea;
                          })
                          .map(s => (
                            <tr key={s.id} className="hover:bg-white/[0.01] transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-500 border border-emerald-500/20 italic">
                                    {s.perfil?.nombre?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-foreground italic">{s.perfil?.nombre} {s.perfil?.apellido}</p>
                                    <p className="text-[10px] text-foreground/30 font-medium">{s.perfil?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <p className="text-sm font-bold text-foreground italic leading-tight">{s.ova?.titulo}</p>
                                <p className="text-[10px] text-emerald-500/50 font-black uppercase tracking-widest italic">{s.ova?.modulos?.nombre}</p>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="text-sm font-black text-foreground/60 italic font-mono">{s.intentos}</span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className={`text-base font-black italic ${s.mejor_puntaje >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {s.mejor_puntaje}%
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="text-sm font-bold text-foreground/40 italic">{s.ultima_calificacion}%</span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <Badge variant={s.completado ? 'emerald' : 'amber'} size="sm" className="italic">
                                  {s.completado ? 'COMPLETADO' : 'PENDIENTE'}
                                </Badge>
                              </td>
                              <td className="px-6 py-5 text-right text-[10px] text-foreground/30 font-bold italic uppercase tracking-tighter">
                                {new Date(s.updated_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button
                                  onClick={() => handleDeleteSeguimiento(s.id)}
                                  className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-foreground/20 hover:text-red-500 border border-red-500/10 transition-all"
                                  title="Eliminar registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        {seguimientoOvas.length === 0 && !loading && (
                          <tr>
                            <td colSpan="7" className="px-6 py-20 text-center text-foreground/30 italic">
                              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-10" />
                              No se han registrado resultados de evaluaciones todavía.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Admin Quick Action Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setIsEditMode(false);
          setNewUser({ nombre: '', apellido: '', password: '', rol: 'estudiante', linea_investigacion: '' });
          setEmailVal('');
        }}
        title={isEditMode ? "Editar Usuario SISINFO" : "Creación de Cuenta SISINFO"}
      >
        <p className="text-amber-400 text-xs italic font-medium p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Las cuentas creadas por el administrador tienen privilegios automáticos según el rol asignado. Se enviará una notificación al usuario.
        </p>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Primer Nombre"
              value={newUser.nombre}
              onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
              className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Apellidos"
              value={newUser.apellido}
              onChange={(e) => setNewUser({...newUser, apellido: e.target.value})}
              className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
              required
            />
          </div>
          <div className="w-full">
            <input
              type="email"
              placeholder="Correo Académico (@unipaz.edu.co)"
              value={emailVal}
              onChange={(e) => {
                handleEmailChange(e);
                // setNewUser({...newUser, email: e.target.value}); // Removed as email is managed by hook
              }}
              className={`w-full bg-card border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all ${
                emailError
                  ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20'
                  : 'border-card-border focus:border-emerald-500'
              }`}
              required
            />
            {emailError && (
              <p className="text-[10px] text-red-500 font-bold italic mt-1 px-1">
                {emailError}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={newUser.rol}
              onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
              className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500"
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
            </select>
             <input
              type="password"
              placeholder={isEditMode ? "Nueva Contraseña (opcional)" : "Contraseña"}
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
              required={!isEditMode}
            />
          </div>

          {newUser.rol === 'docente' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Línea de Conocimiento</label>
              <select
                value={newUser.linea_investigacion}
                onChange={(e) => setNewUser({...newUser, linea_investigacion: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Seleccione una línea...</option>
                <option value="Ingeniería de Software">Ingeniería de Software</option>
                <option value="Robótica">Robótica</option>
                <option value="Ingeniería del Conocimiento">Ingeniería del Conocimiento</option>
                <option value="Redes y Telemática">Redes y Telemática</option>
                <option value="Gestión de la Seguridad Informática">Gestión de la Seguridad Informática</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsUserModalOpen(false)}>Descartar</Button>
            <Button
              type="submit"
              disabled={isCreating || !isEmailValid || !emailVal}
              variant="secondary"
              className="flex-1 font-bold tracking-widest italic"
            >
              {isCreating ? 'PROCESANDO...' : (isEditMode ? 'GUARDAR CAMBIOS' : 'CREAR ACCESO')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Project History Modal */}
      <Modal
        isOpen={isProyectoModalOpen}
        onClose={() => {
          setIsProyectoModalOpen(false);
          setSelectedProyecto(null);
        }}
        title="Expediente del Proyecto"
      >
        {selectedProyecto && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-foreground italic mb-1">{selectedProyecto.nombre}</h3>
              <p className="text-sm text-foreground/60">Creado el: {new Date(selectedProyecto.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-card-border">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest italic mb-1">Fase Actual</p>
                <div className="flex items-center gap-2">
                   <Badge variant={
                     selectedProyecto.fase === 'Aplicación' ? 'emerald' :
                     selectedProyecto.fase === 'Desarrollo' ? 'blue' : 'amber'
                   }>{selectedProyecto.fase || 'Propuesta'}</Badge>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-card-border">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest italic mb-1">Estado</p>
                <div className="flex items-center gap-2">
                   <Badge variant={selectedProyecto.terminado ? 'emerald' : 'blue'}>
                     {selectedProyecto.terminado ? 'Finalizado' : 'En Proceso'}
                   </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest italic">Participantes</p>
              <div className="p-4 rounded-xl bg-card border border-card-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Estudiante:</span>
                  <span className="text-foreground font-bold">{selectedProyecto.estudiante?.nombre || 'Desconocido'} {selectedProyecto.estudiante?.apellido || ''}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Docente Asesor:</span>
                  <span className="text-foreground font-bold">{selectedProyecto.docente?.nombre || 'Pendiente'} {selectedProyecto.docente?.apellido || ''}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground italic flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-400" />
                Historial de Versiones
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {selectedProyecto.versiones_proyecto && selectedProyecto.versiones_proyecto.length > 0 ? (
                  selectedProyecto.versiones_proyecto.map((ver, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-card border border-card-border hover:border-emerald-500/20 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                           <span className="text-emerald-400 text-xs font-bold">V{idx + 1}</span>
                         </div>
                         <div>
                           <p className="text-sm text-foreground font-medium">Entrega #{idx + 1}</p>
                           {ver.created_at && (
                             <p className="text-[10px] text-foreground/40">{new Date(ver.created_at).toLocaleDateString()}</p>
                           )}
                         </div>
                      </div>
                      {ver.documento_url ? (
                        <Button size="sm" variant="outline" onClick={() => descargarArchivo(ver.documento_url, ver.nombre_archivo)} className="text-[10px] py-1 px-3">
                          <Download className="w-3 h-3 mr-1" /> VER
                        </Button>
                      ) : (
                        <span className="text-xs text-foreground/40 italic">Sin documento</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-foreground/40 italic py-4 text-center border border-dashed border-card-border rounded-xl">No hay historial de versiones.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Admin Public Content Modal (News, Events, Gallery) */}
      <Modal
        isOpen={isPublicModalOpen}
        onClose={() => {
          setIsPublicModalOpen(false);
          setEditingPublicItem(null);
          setPublicForm({});
        }}
        title={`${editingPublicItem ? 'Editar' : 'Nueva'} ${publicType === 'noticia' ? 'Noticia' : publicType === 'evento' ? 'Evento' : 'Imagen de Galería'}`}
      >
        <form onSubmit={handleSavePublicItem} className="space-y-4">
          {publicType === 'noticia' && (
            <>
              <input
                type="text"
                placeholder="Título de la noticia"
                value={publicForm.titulo || ''}
                onChange={(e) => setPublicForm({...publicForm, titulo: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={publicForm.fecha || ''}
                  onChange={(e) => setPublicForm({...publicForm, fecha: e.target.value})}
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
                  required
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePublicFileUpload(e, 'imagen_url')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground/40 flex items-center justify-between">
                    <span>{publicForm.imagen_url ? 'Imagen cargada' : 'Subir Imagen'}</span>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <textarea
                placeholder="Contenido de la noticia..."
                value={publicForm.contenido || ''}
                onChange={(e) => setPublicForm({...publicForm, contenido: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none min-h-[150px]"
                required
              />
            </>
          )}

          {publicType === 'evento' && (
            <>
              <input
                type="text"
                placeholder="Título del evento"
                value={publicForm.titulo || ''}
                onChange={(e) => setPublicForm({...publicForm, titulo: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="datetime-local"
                  value={publicForm.fecha_evento ? new Date(publicForm.fecha_evento).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setPublicForm({...publicForm, fecha_evento: e.target.value})}
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
                  required
                />
                <select
                  value={publicForm.tipo || 'proximo'}
                  onChange={(e) => setPublicForm({...publicForm, tipo: e.target.value})}
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
                >
                  <option value="proximo">Próximo</option>
                  <option value="pasado">Pasado / Archivo</option>
                </select>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePublicFileUpload(e, 'imagen_url')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground/40 flex items-center justify-between">
                    <span>{publicForm.imagen_url ? 'Imagen cargada' : 'Subir Imagen'}</span>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <textarea
                placeholder="Descripción corta..."
                value={publicForm.descripcion || ''}
                onChange={(e) => setPublicForm({...publicForm, descripcion: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none min-h-[100px]"
                required
              />
            </>
          )}

          {publicType === 'galeria' && (
            <>
              <div className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-card-border flex flex-col items-center justify-center overflow-hidden mb-4 group hover:border-emerald-500/50 transition-colors">
                {publicForm.imagen_url ? (
                  <>
                    <img src={publicForm.imagen_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <p className="text-white text-xs font-bold">Cambiar Imagen</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-foreground/10 mb-2" />
                    <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest italic">Seleccionar Fotografía</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePublicFileUpload(e, 'imagen_url')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required={!editingPublicItem}
                />
              </div>
              <input
                type="text"
                placeholder="Pie de foto / Título (opcional)"
                value={publicForm.titulo || ''}
                onChange={(e) => setPublicForm({...publicForm, titulo: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
              />
              <select
                value={publicForm.evento_id || ''}
                onChange={(e) => setPublicForm({...publicForm, evento_id: e.target.value || null})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
              >
                <option value="">Vincular a un evento (opcional)</option>
                {eventosAdmin.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.titulo}</option>
                ))}
              </select>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsPublicModalOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="secondary"
              className="flex-1 font-bold italic"
            >
              {editingPublicItem ? 'ACTUALIZAR' : 'PUBLICAR AHORA'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



