import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerMisResultadosOvas, 
  obtenerNotificaciones,
  marcarNotificacionLeida,
  actualizarPerfil
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';
import { toast } from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { 
  User, 
  CheckCircle, 
  Bell, 
  Edit, 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp, 
  Loader2, 
  ExternalLink,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, perfil, refreshPerfil } = useAuth();
  const [resultadosOvas, setResultadosOvas] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado de edición de perfil
  const [editProfileData, setEditProfileData] = useState({
    nombre: '',
    apellido: '',
    semestre: '',
    linea_investigacion: ''
  });

  useEffect(() => {
    if (user && perfil) {
      loadData();
    }
  }, [user, perfil]);

  async function loadData() {
    setLoading(true);
    try {
      const [evaluaciones, notifs] = await Promise.all([
        obtenerMisResultadosOvas(perfil.id),
        obtenerNotificaciones(perfil.id)
      ]);
      setResultadosOvas(evaluaciones || []);
      setNotificaciones(notifs || []);
    } catch (error) {
      console.error("Error loading student dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

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
        semestre: parseInt(editProfileData.semestre) || null,
        linea_investigacion: editProfileData.linea_investigacion || null
      });
      await refreshPerfil();
      setIsEditProfileOpen(false);
      toast.success('Perfil actualizado con éxito');
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error('Error al actualizar perfil: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;
  const ovasAprobados = resultadosOvas.filter(r => r.completado).length;
  const totalIntentos = resultadosOvas.reduce((acc, r) => acc + (r.intentos || 1), 0);
  const promedioPuntaje = resultadosOvas.length > 0 
    ? Math.round(resultadosOvas.reduce((acc, r) => acc + (r.mejor_puntaje || 0), 0) / resultadosOvas.length)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#10346E]" />
        <p className="text-foreground/40 text-sm font-medium">Cargando panel de aprendizaje...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* ─── Encabezado del Perfil ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-[#10346E]/10 dark:bg-blue-950/40 text-[#10346E] dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-[#10346E]/20">
              Estudiante SISINFO
            </span>
            {perfil?.semestre && (
              <span className="text-foreground/50 text-xs font-medium">
                Semestre {perfil.semestre}°
              </span>
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">
            {perfil?.nombre} {perfil?.apellido}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60">
            <span>{perfil?.email}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>
              Línea de Interés: <strong className="text-[#0F172A] dark:text-slate-200">{perfil?.linea_investigacion || 'No asignada'}</strong>
            </span>
          </div>
        </div>

        {/* Acciones de la Cabecera */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Botón de Notificaciones */}
          <button 
            onClick={() => setIsNotificationsModalOpen(true)}
            className="relative p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 shadow-sm transition-all cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {noLeidas}
              </span>
            )}
          </button>

          {/* Editar Perfil */}
          <Button 
            variant="outline"
            onClick={openEditProfile}
            className="gap-2 text-xs font-bold py-2.5 px-4 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Edit className="w-4 h-4" /> Editar Perfil
          </Button>

          {/* Explorar OVAs */}
          <Button 
            onClick={() => navigate('/modulos')}
            className="gap-2 text-xs font-bold py-2.5 px-5 rounded-xl bg-[#10346E] hover:bg-[#18458F] text-white shadow-sm"
          >
            <BookOpen className="w-4 h-4" /> Aula Virtual
          </Button>
        </div>
      </div>

      {/* ─── Métricas de Aprendizaje ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">OVAs Evaluados</span>
            <Layers className="w-4 h-4 text-[#10346E] dark:text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
            {resultadosOvas.length}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Objetos virtuales cursados</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">OVAs Aprobados</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {ovasAprobados}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Evaluaciones superadas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Promedio General</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
            {promedioPuntaje}<span className="text-sm font-normal text-slate-400">/100</span>
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Calificación media de quizzes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Intentos Realizados</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
            {totalIntentos}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Total de repasos y pruebas</p>
        </div>
      </div>

      {/* ─── Historial de Evaluaciones y OVAs ─── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white tracking-tight uppercase">
              Mis Evaluaciones y Quizzes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historial de resultados obtenidos en los Objetos Virtuales de Aprendizaje
            </p>
          </div>

          <button
            onClick={() => navigate('/modulos')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#10346E] dark:text-blue-400 hover:underline uppercase tracking-wider cursor-pointer"
          >
            <span>Ver todas las Líneas de Aprendizaje</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {resultadosOvas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resultadosOvas.map((res) => {
              const ova = res.ova;
              const moduloNombre = ova?.modulos?.nombre || 'Informática';
              return (
                <div
                  key={res.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Badge de Línea y Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#10346E] dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/50 truncate">
                          {moduloNombre}
                        </span>
                        {ova?.tipo === 'curso' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                            Curso
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          res.completado
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60'
                        }`}
                      >
                        {res.completado ? (ova?.tipo === 'curso' ? 'Curso Completado' : 'Aprobado') : 'En Progreso'}
                      </span>
                    </div>

                    {/* Título del OVA */}
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white line-clamp-2 leading-tight group-hover:text-[#10346E] dark:group-hover:text-blue-400 transition-colors">
                      {ova?.titulo || 'Objeto Virtual de Aprendizaje'}
                    </h3>

                    {/* Barra de Puntaje */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Mejor Calificación</span>
                        <span className="font-bold text-[#0F172A] dark:text-white text-sm">
                          {res.mejor_puntaje || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            (res.mejor_puntaje || 0) >= 60 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(res.mejor_puntaje || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadatos y Botón de Repaso */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Intentos: <strong className="text-slate-600 dark:text-slate-300">{res.intentos || 1}</strong></span>
                      <span>{new Date(res.updated_at).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={() => navigate('/modulos')}
                      className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#10346E] dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Repasar en Aula Virtual</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 sm:p-20 flex flex-col items-center justify-center text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#10346E] dark:text-blue-400">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Aún no has realizado evaluaciones</h3>
            <p className="text-foreground/50 text-xs max-w-sm leading-relaxed">
              Explora las líneas de aprendizaje de ingeniería informática, revisa los contenidos interactivos y presenta los quizzes para registrar tu progreso.
            </p>
            <Button
              onClick={() => navigate('/modulos')}
              className="mt-2 py-3 px-6 rounded-xl bg-[#10346E] hover:bg-[#18458F] text-white text-xs font-bold uppercase tracking-wider"
            >
              Comenzar a Aprender
            </Button>
          </div>
        )}
      </div>

      {/* ─── Modal de Edición de Perfil ─── */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Actualizar Datos de Perfil"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Nombre</label>
              <input
                type="text"
                required
                value={editProfileData.nombre}
                onChange={(e) => setEditProfileData({ ...editProfileData, nombre: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:border-[#10346E]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Apellido</label>
              <input
                type="text"
                required
                value={editProfileData.apellido}
                onChange={(e) => setEditProfileData({ ...editProfileData, apellido: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:border-[#10346E]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Semestre Actual</label>
            <input
              type="number"
              min="1"
              max="12"
              value={editProfileData.semestre}
              onChange={(e) => setEditProfileData({ ...editProfileData, semestre: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:border-[#10346E]"
              placeholder="Ej. 6"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Línea de Interés Principal</label>
            <select
              value={editProfileData.linea_investigacion}
              onChange={(e) => setEditProfileData({ ...editProfileData, linea_investigacion: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:border-[#10346E]"
            >
              <option value="">Selecciona una línea...</option>
              <option value="Ingeniería de Software">Ingeniería de Software</option>
              <option value="Robótica">Robótica</option>
              <option value="Ingeniería del Conocimiento">Ingeniería del Conocimiento</option>
              <option value="Redes y Telemática">Redes y Telemática</option>
              <option value="Gestión de la Seguridad Informática">Gestión de la Seguridad Informática</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsEditProfileOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#10346E] text-white">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal de Notificaciones ─── */}
      <Modal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        title="Centro de Notificaciones"
      >
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
          {notificaciones.length > 0 ? (
            notificaciones.map((n) => (
              <div 
                key={n.id}
                onClick={async () => {
                  if (!n.leida) {
                    await marcarNotificacionLeida(n.id);
                    setNotificaciones(prev => prev.map(item => item.id === n.id ? { ...item, leida: true } : item));
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  n.leida 
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-500' 
                    : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50 text-[#0F172A] dark:text-white'
                }`}
              >
                <p className="text-xs font-semibold">{n.mensaje || n.texto || 'Notificación del sistema'}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No tienes notificaciones pendientes.
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}
