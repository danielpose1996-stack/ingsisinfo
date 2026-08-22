import React, { useState, useEffect } from 'react';
import OvaManagerView from '../components/OvaManagerView';
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
  actualizarPerfil,
  descargarArchivo,
  obtenerSeguimientoOvas,
  eliminarResultadoOva,
  eliminarTodoSeguimiento
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
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
  FileText,
  Youtube,
  Globe,
  X,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Función auxiliar para normalizar cadenas en comparaciones (elimina acentos, espacios y mayúsculas)
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

  // Estado del contenido público (Inicio)
  const [noticiasAdmin, setNoticiasAdmin] = useState([]);
  const [eventosAdmin, setEventosAdmin] = useState([]);
  const [galeriaAdmin, setGaleriaAdmin] = useState([]);

  // Estado de selección y modales públicos
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);
  const [publicType, setPublicType] = useState('noticia'); // 'noticia', 'evento', 'galeria'
  const [editingPublicItem, setEditingPublicItem] = useState(null);
  const [publicForm, setPublicForm] = useState({});

  // Estado de los modales
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);

  // Estado del Aula Virtual
  const [selectedModuloAula, setSelectedModuloAula] = useState(null);
  const { email: emailVal, setEmail: setEmailVal, error: emailError, isValid: isEmailValid, handleChange: handleEmailChange, getNormalizedEmail } = useEmailValidation('');
  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido: '',
    password: '',
    rol: 'estudiante',
    linea_investigacion: '' // Usaremos el campo existente en DB
  });

  // Estado de los filtros
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

      // Calcular estadísticas básicas
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
      toast.error("Error al cargar datos del servidor: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (id) => {
    const res = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción es irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    });
    
    if (res.isConfirmed) {
      try {
        await eliminarUsuario(id);
        await loadAdminData();
        toast.success('Usuario eliminado con éxito');
      } catch (error) {
        toast.error('Error al eliminar usuario: ' + error.message);
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

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const updates = {
        nombre: sanitizeText(newUser.nombre),
        apellido: sanitizeText(newUser.apellido),
        rol: newUser.rol,
        linea_investigacion: newUser.rol === 'docente' ? (newUser.linea_investigacion || 'Ingeniería de Software') : null
      };

      await actualizarPerfil(editingProfileId, updates, true);
      toast.success('Rol y permisos del usuario actualizados con éxito.');

      setIsUserModalOpen(false);
      setNewUser({ nombre: '', apellido: '', password: '', rol: 'estudiante', linea_investigacion: '' });
      setEmailVal('');
      setIsEditMode(false);
      setEditingProfileId(null);
      await loadAdminData();
    } catch (error) {
      toast.error('Error al actualizar permisos: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectModuloAula = (modulo) => {
    setSelectedModuloAula(modulo);
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
        type === 'noticia' ? { titulo: '', contenido: '', imagen_url: '', enlace_url: '', pdf_url: '', fecha: new Date().toISOString().split('T')[0] } :
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
      toast.success('Operación realizada con éxito');
    } catch (error) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const handleDeletePublicItem = async (type, id) => {
    const res = await Swal.fire({
      title: '¿Eliminar elemento?',
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
      if (type === 'noticia') await eliminarNoticia(id);
      else if (type === 'evento') await eliminarEvento(id);
      else if (type === 'galeria') await eliminarGaleria(id);
      await loadPublicData();
    } catch (error) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const handlePublicFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await subirArchivoOva(file, 'web-publica'); // Usamos el mismo bucket pero carpeta diferente
      setPublicForm({ ...publicForm, [field]: url });
      toast.success(field === 'pdf_url' ? 'Documento PDF subido con éxito' : 'Imagen subida con éxito');
    } catch (error) {
      console.error(error);
      toast.error(field === 'pdf_url' ? 'Error al subir el documento PDF' : 'Error al subir la imagen');
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
    const res = await Swal.fire({
      title: '¿Eliminar registro?',
      text: "No podrás deshacer esto.",
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
      await eliminarResultadoOva(id);
      await loadSeguimiento();
    } catch (error) {
      toast.error('Error al eliminar registro: ' + error.message);
    }
  };

  const handleDeleteAllSeguimiento = async () => {
    const res1 = await Swal.fire({
      title: '🚨 ADVERTENCIA CRÍTICA',
      text: '¿Estás seguro de eliminar TODO el historial de seguimiento? Esta acción es irreversible y borrará el progreso de todos los estudiantes.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    });
    if (!res1.isConfirmed) return;
    
    const res2 = await Swal.fire({
      title: '¿Estás absolutamente seguro?',
      text: 'Por favor confirma una vez más que deseas realizar esta acción destructiva.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirmar eliminación total',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    });
    if (!res2.isConfirmed) return;
    
    try {
      await eliminarTodoSeguimiento();
      await loadSeguimiento();
      toast.success('Se ha limpiado todo el historial de seguimiento correctamente.');
    } catch (error) {
      toast.error('Error al limpiar seguimiento: ' + error.message);
    }
  };

  // Filtros de seguimiento
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [filterOva, setFilterOva] = useState('');

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Navegación lateral */}
      <aside className="w-full lg:w-72 bg-card border-r border-card-border p-6 space-y-8">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center border border-[#1E3A8A]/20">
            <ShieldCheck className="w-6 h-6 text-[#1E3A8A]" />
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/10 shadow-[0_0_20px_rgba(5,150,105,0.05)]' : 'text-foreground/40 hover:text-foreground hover:bg-background/80'}`}
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
               <span className="w-2 h-2 rounded-full bg-[#1E3A8A] animate-pulse" />
               <span className="text-xs text-foreground font-medium italic">Base de Datos Conectada</span>
             </div>
          </GlassCard>
        </div>
      </aside>

      {/* Área principal de contenido */}
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
                {/* Cuadrícula de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GlassCard className="p-8 border-card-border hover:border-[#1E3A8A]/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-[#1E3A8A]/10 border border-[#1E3A8A]/20">
                        <Users className="w-6 h-6 text-[#1E3A8A]" />
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

                {/* Actividad y proyectos recientes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <GlassCard className="p-6">
                     <h3 className="text-xl font-bold text-foreground mb-6 italic flex items-center gap-2">
                       <FileCheck className="w-5 h-5 text-[#1E3A8A]" /> Últimos Proyectos
                     </h3>
                     <div className="space-y-4">
                       {proyectos.slice(0, 5).map(p => (
                         <div key={p.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-transparent hover:border-card-border transition-all group">
                           <div>
                             <h4 className="text-sm font-bold text-foreground italic mb-1">{p.nombre}</h4>
                             <p className="text-[10px] text-foreground/40 font-medium">Estudiante: {p.estudiante?.nombre} · {new Date(p.created_at).toLocaleDateString()}</p>
                           </div>
                           <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-[#1E3A8A] transition-colors" />
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
                        className="bg-background border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]/50 min-w-[320px] shadow-inner transition-all"
                      />
                    </div>
                    <select
                      value={filterUserRol}
                      onChange={(e) => setFilterUserRol(e.target.value)}
                      className="bg-background border border-card-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]/50 outline-none italic shadow-sm transition-all"
                    >
                      <option value="">TODOS LOS ROLES</option>
                      <option value="admin">ADMINISTRADORES</option>
                      <option value="docente">DOCENTES</option>
                      <option value="estudiante">ESTUDIANTES</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E3A8A]/10 border border-[#1E3A8A]/20 text-[#1E3A8A] text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" /> Registro Google OAuth
                    </div>
                  </div>
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
                              <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-xs font-bold text-[#1E3A8A] border border-card-border italic shadow-sm group-hover:scale-105 transition-transform">
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
                                className="p-2 rounded-lg bg-card hover:bg-[#1E3A8A]/10 text-foreground/40 hover:text-[#1E3A8A] border border-card-border"
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
                        className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]/50 italic shadow-sm transition-all"
                        onChange={(e) => setFilterLinea(e.target.value)}
                      >
                        <option value="">Todas las Líneas</option>
                        <option value="Ingeniería de Software">Ingeniería de Software</option>
                        <option value="Robótica">Robótica</option>
                        <option value="Ingeniería del Conocimiento">Ingeniería del Conocimiento</option>
                        <option value="Redes y Telemática">Redes y Telemática</option>
                        <option value="Gestión de la Seguridad Informática">Gestión de la Seguridad Informática</option>
                        <option value="Ingeniería Informática">Ingeniería Informática</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] text-foreground/40 font-bold uppercase mb-1.5 ml-1 italic">Filtrar por Fase</label>
                      <select
                        value={filterFase}
                        className="w-full bg-background border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]/50 italic shadow-sm transition-all"
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
                    className="gap-2 italic py-3 px-6 h-[46px] border-[#1E3A8A]/10 hover:bg-[#1E3A8A]/5"
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
                       className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-left group ${selectedModuloAula?.id === m.id ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20' : 'hover:bg-background/80 text-foreground/40 hover:text-[#1E3A8A] border border-transparent'}`}
                     >
                       <span className="text-sm font-bold italic">{m.nombre}</span>
                       <ChevronRight className={`w-4 h-4 transition-transform ${selectedModuloAula?.id === m.id ? 'rotate-90 text-[#1E3A8A]' : 'opacity-0 group-hover:opacity-100'}`} />
                     </button>
                   ))}
                 </GlassCard>

                 <div className="lg:col-span-3">
                   <OvaManagerView modulo={selectedModuloAula} />
                 </div>
               </div>
            )}

            {activeTab === 'publico' && (
              <div className="space-y-12 pb-20">
                {loadingPublic ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]"></div>
                  </div>
                ) : (
                  <>
                    <section>
                      <div className="flex items-center justify-between mb-8 border-b border-card-border pb-4">
                        <h3 className="text-2xl font-bold flex items-center gap-3 italic">
                          <span className="w-2 h-8 bg-[#1E3A8A] rounded-full" />
                          📰 Noticias y Novedades
                        </h3>
                        <Button size="sm" onClick={() => handleOpenPublicModal('noticia')}>+ Redactar Noticia</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {noticiasAdmin.map(n => (
                          <GlassCard key={n.id} className="p-4 border-card-border group hover:border-[#1E3A8A]/30 transition-all">
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-card">
                              {n.imagen_url ? (
                                <img 
                                  src={n.imagen_url} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = ''; // Limpiar src para evitar el icono de imagen dañada
                                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-foreground/10"><ImageIcon className="w-12 h-12" /></div>';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-foreground/10">
                                  <ImageIcon className="w-12 h-12" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenPublicModal('noticia', n)} className="p-2 rounded-lg bg-black/60 text-white hover:bg-[#1E3A8A] transition-colors">
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
                        className="bg-card border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-[#1E3A8A]/50 min-w-[280px] outline-none italic transition-all"
                      />
                    </div>
                    <select
                      className="bg-background border border-card-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:border-[#1E3A8A]/50 outline-none italic shadow-sm transition-all"
                      value={filterOva}
                      onChange={(e) => setFilterOva(e.target.value)}
                    >
                      <option value="">Todas las OVAs</option>
                      {[...new Set(seguimientoOvas.map(s => s.ova?.titulo))].filter(Boolean).map(titulo => (
                        <option key={titulo} value={titulo}>{titulo}</option>
                      ))}
                    </select>
                    <select
                      className="bg-background border border-card-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:border-[#1E3A8A]/50 outline-none italic shadow-sm transition-all"
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

                {/* Resumen destacado de métricas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <GlassCard className="p-6 border-[#1E3A8A]/20 bg-[#1E3A8A]/5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-[#1E3A8A]/10 border border-[#1E3A8A]/20">
                        <FileCheck className="w-6 h-6 text-[#1E3A8A]" />
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
                                  <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-[10px] font-black text-[#1E3A8A] border border-[#1E3A8A]/20 italic">
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
                                <p className="text-[10px] text-[#1E3A8A]/50 font-black uppercase tracking-widest italic">{s.ova?.modulos?.nombre}</p>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="text-sm font-black text-foreground/60 italic font-mono">{s.intentos}</span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className={`text-base font-black italic ${s.mejor_puntaje >= 60 ? 'text-[#1E3A8A]' : 'text-red-400'}`}>
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

      {/* Modal de administración de rol y permisos */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setIsEditMode(false);
          setNewUser({ nombre: '', apellido: '', password: '', rol: 'estudiante', linea_investigacion: '' });
          setEmailVal('');
        }}
        title="Modificar Rol y Permisos de Usuario"
      >
        <p className="text-blue-500 text-xs italic font-medium p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
          <ShieldCheck className="w-4 h-4 inline mr-2 text-[#1E3A8A]" />
          Los usuarios ingresan con su cuenta institucional de Google. Desde este panel puedes ascender sus permisos a Docente o Administrador.
        </p>

        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Nombre"
                value={newUser.nombre}
                onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase mb-1">Apellidos</label>
              <input
                type="text"
                placeholder="Apellidos"
                value={newUser.apellido}
                onChange={(e) => setNewUser({...newUser, apellido: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase mb-1">Correo Institucional (Google)</label>
            <input
              type="email"
              value={emailVal}
              disabled
              className="w-full bg-card/50 border border-card-border rounded-xl py-3 px-4 text-sm text-foreground/60 cursor-not-allowed font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase mb-1">Rol en la Plataforma</label>
            <select
              value={newUser.rol}
              onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
              className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente / Director</option>
              <option value="admin">Administrador Global</option>
            </select>
          </div>

          {newUser.rol === 'docente' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest px-1 italic">Línea de Conocimiento Asignada</label>
              <select
                value={newUser.linea_investigacion}
                onChange={(e) => setNewUser({...newUser, linea_investigacion: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]"
                required
              >
                <option value="">Seleccione una línea...</option>
                <option value="Ingeniería de Software">Ingeniería de Software</option>
                <option value="Robótica">Robótica</option>
                <option value="Ingeniería del Conocimiento">Ingeniería del Conocimiento</option>
                <option value="Redes y Telemática">Redes y Telemática</option>
                <option value="Gestión de la Seguridad Informática">Gestión de la Seguridad Informática</option>
                <option value="Ingeniería Informática">Ingeniería Informática</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsUserModalOpen(false)}>Descartar</Button>
            <Button
              type="submit"
              disabled={isCreating}
              variant="secondary"
              className="flex-1 font-bold tracking-widest italic"
            >
              {isCreating ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal del historial de proyectos del administrador */}
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
                <FolderTree className="w-4 h-4 text-[#1E3A8A]" />
                Historial de Versiones
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {selectedProyecto.versiones_proyecto && selectedProyecto.versiones_proyecto.length > 0 ? (
                  selectedProyecto.versiones_proyecto.map((ver, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-card border border-card-border hover:border-[#1E3A8A]/20 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center border border-[#1E3A8A]/20">
                           <span className="text-[#1E3A8A] text-xs font-bold">V{idx + 1}</span>
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

      {/* Modal de contenido público del administrador (noticias, eventos y galería) */}
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
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={publicForm.fecha || ''}
                  onChange={(e) => setPublicForm({...publicForm, fecha: e.target.value})}
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
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
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none min-h-[150px]"
                required
              />
              <div className="relative">
                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                  type="url"
                  placeholder="Enlace al artículo (opcional)"
                  value={publicForm.enlace_url || ''}
                  onChange={(e) => setPublicForm({...publicForm, enlace_url: e.target.value})}
                  className="w-full bg-card border border-card-border rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none placeholder:text-foreground/30"
                />
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handlePublicFileUpload(e, 'pdf_url')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground/40 flex items-center justify-between animate-in fade-in">
                  <span>{publicForm.pdf_url ? '📄 PDF cargado' : 'Subir Documento PDF (opcional)'}</span>
                  <FileText className="w-4 h-4 text-red-400" />
                </div>
              </div>
              {publicForm.pdf_url && (
                <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <span className="text-xs text-red-400 font-bold truncate max-w-[280px]">
                    PDF Adjunto Activo
                  </span>
                  <button
                    type="button"
                    onClick={() => setPublicForm({...publicForm, pdf_url: null})}
                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                  >
                    Eliminar PDF
                  </button>
                </div>
              )}
            </>
          )}

          {publicType === 'evento' && (
            <>
              <input
                type="text"
                placeholder="Título del evento"
                value={publicForm.titulo || ''}
                onChange={(e) => setPublicForm({...publicForm, titulo: e.target.value})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="datetime-local"
                  value={publicForm.fecha_evento ? new Date(publicForm.fecha_evento).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setPublicForm({...publicForm, fecha_evento: e.target.value})}
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
                  required
                />
                <select
                  value={publicForm.tipo || 'proximo'}
                  onChange={(e) => setPublicForm({...publicForm, tipo: e.target.value})}
                  className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
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
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none min-h-[100px]"
                required
              />
            </>
          )}

          {publicType === 'galeria' && (
            <>
              <div className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-card-border flex flex-col items-center justify-center overflow-hidden mb-4 group hover:border-[#1E3A8A]/50 transition-colors">
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
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
              />
              <select
                value={publicForm.evento_id || ''}
                onChange={(e) => setPublicForm({...publicForm, evento_id: e.target.value || null})}
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-[#1E3A8A] outline-none"
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



