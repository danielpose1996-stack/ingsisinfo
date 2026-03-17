import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerEstadisticasAdmin, 
  obtenerTodosUsuarios, 
  obtenerTodosProyectos,
  obtenerModulos,
  obtenerContenidosModulo,
  actualizarNoticia,
  actualizarEvento,
  eliminarUsuario,
  registrarUsuario,
  actualizarPerfil,
  descargarArchivo,
  obtenerOvasModulo,
  crearOva,
  actualizarOva,
  eliminarOva,
  subirArchivoOva
} from '../lib/supabase';
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, pendingProjects: 0, totalFinalized: 0 });
  const [usuarios, setUsuarios] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [isCreating, setIsCreating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState(null); // Usaremos el ID de perfil (PK) para mayor seguridad

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [users, proys, mods] = await Promise.all([
        obtenerTodosUsuarios(),
        obtenerTodosProyectos(),
        obtenerModulos()
      ]);
      setUsuarios(users);
      setProyectos(proys);
      setModulos(mods);

      // Calculate basic stats
      setStats({
        totalUsers: users.length,
        totalProjects: proys.length,
        pendingProjects: proys.filter(p => !p.terminado).length,
        totalFinalized: proys.filter(p => p.terminado).length
      });
    } catch (error) {
      console.error("Error loading admin data:", error);
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
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          email: normalizedEmail,
          rol: newUser.rol,
          linea_investigacion: newUser.rol === 'docente' ? (newUser.linea_investigacion || 'Ingeniería de Software') : null
        };

        await actualizarPerfil(editingProfileId, updates, true); // Pasar flag de que es profileId
        alert('Usuario actualizado con éxito.');
      } else {
        // Lógica de creación (existente)
        const result = await registrarUsuario({ ...newUser, email: normalizedEmail });

        if (result.isBypass) {
          alert('MODO DESARROLLO ACTIVADO: Usuario creado directamente en la base de datos (sin correo). \n\nImportante: Por favor usa la contraseña ' + (newUser.password || '"password123"') + ' para iniciar sesión con esta cuenta.');
        } else {
          alert('Usuario creado con éxito. Se ha enviado un correo de confirmación.');
        }
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
      contenido: [{ titulo: '', contenido: '', recurso_url: '' }],
      recursos: { pdf_url: '', youtube_url: '', link_externo: '' },
      actividad_final: '',
      estado: 'borrador'
    });
    setIsOvaFormOpen(true);
  };

  const handleEditOva = (ova) => {
    setEditingOva(ova);
    setOvaForm({
      ...ova,
      contenido: ova.contenido || [],
      recursos: ova.recursos || { pdf_url: '', youtube_url: '', link_externo: '' }
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
      const dataToSave = {
        ...ovaForm,
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

  const handleAddSection = () => {
    setOvaForm({
      ...ovaForm,
      contenido: [...ovaForm.contenido, { titulo: '', contenido: '', recurso_url: '' }]
    });
  };

  const handleRemoveSection = (index) => {
    const newContenido = [...ovaForm.contenido];
    newContenido.splice(index, 1);
    setOvaForm({ ...ovaForm, contenido: newContenido });
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
    { id: 'publico', label: 'Inicio', icon: Settings },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-backgroundackground">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-cardard border-r border-card-border p-6 space-y-8">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'text-foreground/40 hover:text-foreground hover:bg-backgroundackground/80'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-10">
          <GlassCard className="p-4 bg-backgroundlue-500/5">
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
                      <div className="p-3 rounded-2xl bg-backgroundlue-500/10 border border-blue-500/20">
                        <FolderTree className="w-6 h-6 text-blue-500" />
                      </div>
                      <Badge variant="blue">+5 este mes</Badge>
                    </div>
                    <p className="text-5xl font-black text-foreground italic mb-1 uppercase tracking-tighter">{stats.totalProjects}</p>
                    <p className="text-foreground/40 text-sm font-bold uppercase tracking-widest italic">Proyectos Totales</p>
                  </GlassCard>

                  <GlassCard className="p-8 border-card-border hover:border-amber-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-cardmber-500/10 border border-amber-500/20">
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
                         <div key={p.id} className="flex items-center justify-between p-4 bg-cardard rounded-xl border border-transparent hover:border-card-border transition-all group">
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
                         <div key={u.id} className="flex items-center gap-4 p-3 hover:bg-cardard rounded-xl transition-colors">
                           <div className="w-10 h-10 rounded-full bg-backgroundlue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/10 text-xs italic">
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
                <div className="p-6 border-b border-card-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cardard/30">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="bg-backgroundackground border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 min-w-[320px] shadow-inner transition-all"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 italic text-xs uppercase tracking-tight">
                      <Filter className="w-3 h-3" /> Filtrar
                    </Button>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsUserModalOpen(true)} className="italic font-bold tracking-widest px-6">
                    + AÑADIR USUARIO
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-backgroundackground/50 border-b border-card-border">
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Usuario</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Rol</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Carrera / Línea</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic">Registro</th>
                        <th className="px-6 py-4 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {usuarios.map(u => (
                        <tr key={u.id} className="hover:bg-backgroundackground/40 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-cardard flex items-center justify-center text-xs font-bold text-emerald-500 border border-card-border italic shadow-sm group-hover:scale-105 transition-transform">
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
                                className="p-2 rounded-lg bg-cardard hover:bg-emerald-500/10 text-foreground/40 hover:text-emerald-500 border border-card-border"
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {activeTab === 'proyectos' && (
              <div className="space-y-6">
                <div className="flex grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    className="bg-cardard border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 italic shadow-sm"
                    onChange={(e) => setFilterLinea(e.target.value)}
                  >
                    <option value="">Línea: Todas</option>
                    <option value="Ingeniería de Software">Ingeniería de Software</option>
                    <option value="Robótica">Robótica</option>
                    <option value="Ingeniería del Conocimiento">Ingeniería del Conocimiento</option>
                    <option value="Redes y Telemática">Redes y Telemática</option>
                    <option value="Gestión de la Seguridad Informática">Gestión de la Seguridad Informática</option>
                  </select>
                   <select
                    className="bg-cardard border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 italic shadow-sm"
                    onChange={(e) => setFilterFase(e.target.value)}
                  >
                    <option value="">Fase: Todas</option>
                    <option value="Propuesta">Propuesta</option>
                    <option value="Desarrollo">Desarrollo</option>
                    <option value="Aplicación">Aplicación</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const filteredProyectos = proyectos
                      .filter(p => !filterLinea || p.linea_investigacion === filterLinea)
                      .filter(p => !filterFase || p.estado?.toLowerCase() === filterFase.toLowerCase());

                    if (filteredProyectos.length === 0) {
                      return (
                        <div className="col-span-full py-12 text-center text-foreground/40 italic bg-cardard border border-dashed border-card-border rounded-2xl">
                          No se encontraron proyectos para los filtros seleccionados.
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
                       className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-left group ${selectedModuloAula?.id === m.id ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'hover:bg-backgroundackground/80 text-foreground/40 hover:text-emerald-500 border border-transparent'}`}
                     >
                       <span className="text-sm font-bold italic">{m.nombre}</span>
                       <ChevronRight className={`w-4 h-4 transition-transform ${selectedModuloAula?.id === m.id ? 'rotate-90 text-emerald-500' : 'opacity-0 group-hover:opacity-100'}`} />
                     </button>
                   ))}
                 </GlassCard>

                 <div className="lg:col-span-3 space-y-6">
                   {!selectedModuloAula ? (
                     <GlassCard className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                       <div className="w-16 h-16 rounded-2xl bg-cardard flex items-center justify-center text-gray-600">
                         <BookOpen className="w-8 h-8" />
                       </div>
                       <h3 className="text-xl font-bold text-foreground italic">Gestión de Contenidos Aula Virtual</h3>
                       <p className="text-foreground/40 italic max-w-sm leading-relaxed">
                         Selecciona una línea de aprendizaje a la izquierda para administrar sus OVAs (Objetos Virtuales de Aprendizaje).
                       </p>
                     </GlassCard>
                   ) : isOvaFormOpen ? (
                     <GlassCard className="p-8 border-card-border">
                       {/* OVA FORM */}
                       <div className="flex items-center justify-between mb-8 pb-4 border-b border-card-border">
                         <div className="flex items-center gap-4">
                           <button
                             onClick={() => setIsOvaFormOpen(false)}
                             className="p-2 rounded-lg bg-cardard hover:bg-white/10 text-foreground/60 transition-colors"
                           >
                             <ArrowLeft className="w-5 h-5" />
                           </button>
                           <h3 className="text-xl font-bold text-foreground italic">
                             {editingOva ? 'Editar OVA' : 'Crear nuevo OVA'}
                           </h3>
                         </div>
                         <div className="flex gap-3">
                           <Button
                             onClick={() => setOvaForm({...ovaForm, estado: 'borrador'})}
                             variant="outline"
                             className={`text-xs italic py-2 px-6 ${ovaForm.estado === 'borrador' ? 'border-amber-500 text-amber-500 bg-cardmber-500/5' : ''}`}
                           >
                             SOLO BORRADOR
                           </Button>
                           <Button
                             onClick={() => setOvaForm({...ovaForm, estado: 'publicado'})}
                             variant="secondary"
                             className={`text-xs italic py-2 px-6 ${ovaForm.estado === 'publicado' ? 'bg-emerald-500 text-black' : ''}`}
                           >
                             LISTO PARA PUBLICAR
                           </Button>
                           <Button onClick={handleSaveOva} className="gap-2 italic text-xs py-2 px-8">
                             <Save className="w-4 h-4" /> GUARDAR OVA
                           </Button>
                         </div>
                       </div>

                       <div className="space-y-12">
                         {/* DATOS GENERALES */}
                         <section className="space-y-6">
                           <h4 className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] italic">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Datos Generales
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4 md:col-span-2">
                               <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Título del OVA *</label>
                               <input
                                 type="text"
                                 placeholder="Ingrese un título impactante..."
                                 value={ovaForm.titulo}
                                 onChange={(e) => setOvaForm({...ovaForm, titulo: e.target.value})}
                                 className="w-full bg-cardard border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-emerald-500 outline-none transition-all italic font-bold"
                               />
                             </div>
                             <div className="space-y-4">
                               <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Objetivo Pedagógico *</label>
                               <textarea
                                 placeholder="¿Qué aprenderá el estudiante?"
                                 value={ovaForm.objetivo}
                                 onChange={(e) => setOvaForm({...ovaForm, objetivo: e.target.value})}
                                 className="w-full bg-cardard border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-emerald-500 outline-none transition-all italic h-32 resize-none"
                               />
                             </div>
                             <div className="space-y-4">
                               <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Imagen de Portada</label>
                               <div className="flex flex-col gap-4">
                                 {ovaForm.imagen_portada ? (
                                   <div className="relative group rounded-xl overflow-hidden border border-card-border aspect-video">
                                     <img src={ovaForm.imagen_portada} className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-backgroundlack/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                       <button onClick={() => setOvaForm({...ovaForm, imagen_portada: ''})} className="p-2 bg-red-500 text-foreground rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                   </div>
                                 ) : (
                                   <label className="flex flex-col items-center justify-center gap-3 w-full h-32 rounded-xl border-2 border-dashed border-card-border hover:border-emerald-500/30 bg-card/20 cursor-pointer transition-all">
                                      <ImageIcon className="w-6 h-6 text-gray-600" />
                                      <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic">Subir Imagen .JPG / .PNG</span>
                                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'portada')} className="hidden" />
                                   </label>
                                 )}
                               </div>
                             </div>
                             <div className="space-y-4 md:col-span-2">
                               <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Descripción Breve</label>
                               <input
                                 type="text"
                                 placeholder="Resumen del contenido del OVA..."
                                 value={ovaForm.descripcion}
                                 onChange={(e) => setOvaForm({...ovaForm, descripcion: e.target.value})}
                                 className="w-full bg-cardard border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-emerald-500 outline-none transition-all italic"
                               />
                             </div>
                           </div>
                         </section>

                         {/* CONTENIDO DÍNAMICO */}
                         <section className="space-y-8">
                           <div className="flex justify-between items-center">
                             <h4 className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] italic">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Estructura de Contenido
                             </h4>
                             <button
                               onClick={handleAddSection}
                               className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest italic"
                             >
                               <PlusCircle className="w-4 h-4" /> Añadir Sección
                             </button>
                           </div>

                           <div className="space-y-4">
                              <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Introducción</label>
                              <textarea
                                placeholder="Escribe el marco introductorio aquí..."
                                value={ovaForm.introduccion}
                                onChange={(e) => setOvaForm({...ovaForm, introduccion: e.target.value})}
                                className="w-full bg-cardard border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-emerald-500 outline-none transition-all italic h-24 resize-none"
                              />
                           </div>

                           <div className="space-y-12">
                             {ovaForm.contenido.map((section, idx) => (
                               <div key={idx} className="relative p-8 rounded-3xl bg-card/20 border border-card-border space-y-6">
                                 <button
                                   onClick={() => handleRemoveSection(idx)}
                                   className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-400 transition-colors"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>

                                 <div className="flex items-center gap-4 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black italic text-sm">
                                     0{idx + 1}
                                   </div>
                                   <input
                                     type="text"
                                     placeholder="Título de la sección..."
                                     value={section.titulo}
                                     onChange={(e) => {
                                       const newContenido = [...ovaForm.contenido];
                                       newContenido[idx].titulo = e.target.value;
                                       setOvaForm({...ovaForm, contenido: newContenido});
                                     }}
                                     className="bg-transparent border-b border-card-border py-2 text-lg font-bold text-foreground focus:border-emerald-500 outline-none transition-all italic w-full"
                                   />
                                 </div>

                                 <textarea
                                   placeholder="Contenido teórico y práctico de esta sección..."
                                   value={section.contenido}
                                   onChange={(e) => {
                                     const newContenido = [...ovaForm.contenido];
                                     newContenido[idx].contenido = e.target.value;
                                     setOvaForm({...ovaForm, contenido: newContenido});
                                   }}
                                   className="w-full bg-transparent border border-card-border rounded-2xl py-4 px-5 text-sm text-gray-300 focus:border-emerald-500 outline-none transition-all italic h-48 resize-none leading-relaxed"
                                 />

                                 <div className="pt-4 flex flex-wrap gap-4 items-center">
                                   {section.recurso_url ? (
                                      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                                        <ExternalLink className="w-4 h-4" /> Recurso Subido OK
                                        <button onClick={() => {
                                          const nc = [...ovaForm.contenido];
                                          nc[idx].recurso_url = '';
                                          setOvaForm({...ovaForm, contenido: nc});
                                        }} className="ml-2 hover:text-red-400"><X className="w-3 h-3" /></button>
                                      </div>
                                   ) : (
                                      <label className="flex items-center gap-2 px-6 py-2 rounded-xl bg-cardard border border-card-border text-foreground/60 hover:text-foreground hover:bg-white/10 cursor-pointer transition-all text-[10px] font-bold uppercase tracking-widest italic">
                                        <Plus className="w-4 h-4" /> Adjuntar Recurso Adicional
                                        <input type="file" onChange={(e) => handleFileUpload(e, 'seccion', idx)} className="hidden" />
                                      </label>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </section>

                         {/* RECURSOS Y ACTIVIDAD */}
                         <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                              <h4 className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Material Complementario
                              </h4>
                              <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-3">
                                  <label className="flex items-center gap-2 text-[10px] text-foreground/40 font-bold italic uppercase tracking-widest">
                                    <FileDown className="w-3 h-3" /> Guía PDF
                                  </label>
                                  {ovaForm.recursos.pdf_url ? (
                                    <div className="flex items-center justify-between text-xs text-foreground bg-emerald-500/10 p-2 rounded-lg italic">
                                      <span>Archivo cargado</span>
                                      <button onClick={() => setOvaForm({...ovaForm, recursos: {...ovaForm.recursos, pdf_url: ''}})} className="text-red-400"><X className="w-4 h-4" /></button>
                                    </div>
                                  ) : (
                                    <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'pdf')} className="w-full text-xs text-foreground/60" />
                                  )}
                                </div>
                                <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-3">
                                  <label className="flex items-center gap-2 text-[10px] text-foreground/40 font-bold italic uppercase tracking-widest">
                                    <Youtube className="w-3 h-3" /> Link YouTube
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="https://youtube.com/..."
                                    value={ovaForm.recursos.youtube_url}
                                    onChange={(e) => setOvaForm({...ovaForm, recursos: {...ovaForm.recursos, youtube_url: e.target.value}})}
                                    className="w-full bg-transparent border-b border-card-border py-1 text-xs text-foreground focus:border-red-500 outline-none italic"
                                  />
                                </div>
                                <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-3">
                                  <label className="flex items-center gap-2 text-[10px] text-foreground/40 font-bold italic uppercase tracking-widest">
                                    <Globe className="w-3 h-3" /> Enlace Externo
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="https://..."
                                    value={ovaForm.recursos.link_externo}
                                    onChange={(e) => setOvaForm({...ovaForm, recursos: {...ovaForm.recursos, link_externo: e.target.value}})}
                                    className="w-full bg-transparent border-b border-card-border py-1 text-xs text-foreground focus:border-blue-500 outline-none italic"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <h4 className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Evaluación Final
                              </h4>
                              <div className="space-y-4">
                                <label className="text-[10px] text-foreground/40 font-bold uppercase italic ml-1">Instrucciones de Actividad</label>
                                <textarea
                                  placeholder="Describe los pasos finales para validar el aprendizaje..."
                                  value={ovaForm.actividad_final}
                                  onChange={(e) => setOvaForm({...ovaForm, actividad_final: e.target.value})}
                                  className="w-full bg-cardard border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-emerald-500 outline-none transition-all italic h-48 resize-none"
                                />
                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-emerald-400" />
                                  </div>
                                  <p className="text-[10px] text-foreground/40 italic leading-relaxed">
                                    Recuerda que una actividad clara incentiva la <span className="text-emerald-400 font-bold">participación</span> y el compromiso del estudiante con la línea de investigación.
                                  </p>
                                </div>
                              </div>
                            </div>
                         </section>

                         <div className="pt-12 border-t border-card-border flex justify-end gap-4 pb-10">
                            <Button
                              onClick={() => setIsOvaFormOpen(false)}
                              variant="outline"
                              className="italic uppercase tracking-widest py-3 px-10"
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleSaveOva} className="gap-2 italic uppercase tracking-widest py-3 px-16">
                              <Save className="w-4 h-4" /> Finalizar y Guardar OVA
                            </Button>
                         </div>
                       </div>
                     </GlassCard>
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
                            {[1, 2].map(i => <div key={i} className="h-64 rounded-3xl bg-cardard animate-pulse" />)}
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
                                     className="p-2 rounded-lg bg-cardard hover:bg-white/10 text-foreground/60 hover:text-emerald-400"
                                   >
                                     {ova.estado === 'publicado' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                   </button>
                                   <button
                                     onClick={() => handleEditOva(ova)}
                                     className="p-2 rounded-lg bg-cardard hover:bg-white/10 text-foreground/60 hover:text-foreground"
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
              <div className="space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-8 border-b border-card-border pb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-3 italic">
                      <span className="w-2 h-8 bg-emerald-500 rounded-full" />
                      📰 Noticias y Novedades
                    </h3>
                    <Button size="sm">+ Redactar Noticia</Button>
                  </div>
                  <p className="text-foreground/40 italic py-10 text-center bg-cardard rounded-2xl border border-dashed border-card-border">
                    Carga de noticias globales... presione el botón "+" para crear la primera.
                  </p>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-8 border-b border-card-border pb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-3 italic">
                      <span className="w-2 h-8 bg-backgroundlue-500 rounded-full" />
                      📅 Eventos Semilleristas
                    </h3>
                    <Button size="sm">+ Agendar Evento</Button>
                  </div>
                   <p className="text-foreground/40 italic py-10 text-center bg-cardard rounded-2xl border border-dashed border-card-border">
                    Sincronizando calendario de eventos...
                  </p>
                </section>
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
        <p className="text-amber-400 text-xs italic font-medium p-4 bg-cardmber-500/10 border border-amber-500/20 rounded-xl mb-6">
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
              className="bg-cardard border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Apellidos"
              value={newUser.apellido}
              onChange={(e) => setNewUser({...newUser, apellido: e.target.value})}
              className="bg-cardard border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
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
              className={`w-full bg-cardard border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all ${
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
              className="bg-[#1a1c22] border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500"
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
            </select>
             <input
              type="password"
              placeholder={isEditMode ? "Nueva Contraseña (opcional)" : "Contraseña"}
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className="bg-cardard border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500 outline-none"
              required={!isEditMode}
            />
          </div>

          {newUser.rol === 'docente' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">Línea de Conocimiento</label>
              <select
                value={newUser.linea_investigacion}
                onChange={(e) => setNewUser({...newUser, linea_investigacion: e.target.value})}
                className="w-full bg-[#1a1c22] border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-emerald-500"
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
              <div className="p-4 rounded-xl bg-cardard border border-card-border">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest italic mb-1">Fase Actual</p>
                <div className="flex items-center gap-2">
                   <Badge variant={
                     selectedProyecto.fase === 'Aplicación' ? 'emerald' :
                     selectedProyecto.fase === 'Desarrollo' ? 'blue' : 'amber'
                   }>{selectedProyecto.fase || 'Propuesta'}</Badge>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-cardard border border-card-border">
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
              <div className="p-4 rounded-xl bg-cardard border border-card-border space-y-3">
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
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-cardard border border-card-border hover:border-emerald-500/20 transition-colors">
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
    </div>
  );
}



