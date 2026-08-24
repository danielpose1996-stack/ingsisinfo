import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerModulos } from '../lib/supabase';
import OvaManagerView from '../components/OvaManagerView';
import { 
  GraduationCap, 
  Loader2, 
  BookOpen, 
  Layers,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, perfil } = useAuth();
  const [docenteModulo, setDocenteModulo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && perfil) {
      loadTeacherModule();
    }
  }, [user, perfil]);

  async function loadTeacherModule() {
    setLoading(true);
    try {
      const modulos = await obtenerModulos();
      const match = (modulos || []).find(
        m => m.nombre?.toLowerCase().trim() === perfil.linea_investigacion?.toLowerCase().trim()
      );
      if (match) {
        setDocenteModulo(match);
      }
    } catch (error) {
      console.error("Error loading teacher module:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-9 h-9 animate-spin text-[#15326C] dark:text-blue-400" />
        <p className="text-foreground/50 text-xs font-medium">Cargando panel de docente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* ─── Encabezado del Docente ─── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-card-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#15326C] dark:text-blue-300 text-[11px] font-semibold border border-blue-200/50 dark:border-blue-800/50">
              Docente Asesor
            </span>
            <span className="text-foreground/50 text-xs">
              Línea de Investigación: <strong className="text-foreground font-semibold">{perfil?.linea_investigacion || 'No asignada'}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Prof. {perfil?.nombre} {perfil?.apellido || ''}
          </h1>

          <p className="text-xs text-foreground/60 max-w-2xl leading-relaxed">
            Administra, diseña y publica los Objetos Virtuales de Aprendizaje (OVAs) y evaluaciones para tu línea de investigación.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-inner">
            <div className="p-2 rounded-xl bg-blue-100/70 dark:bg-blue-900/40 text-[#15326C] dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Línea Asignada</p>
              <p className="text-xs font-bold text-foreground">
                {docenteModulo?.nombre || perfil?.linea_investigacion || 'Sin asignar'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Gestión de OVAs de la Línea ─── */}
      {!docenteModulo ? (
        <div className="p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-card-border rounded-3xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Sin Línea de Investigación Vinculada</h3>
            <p className="text-foreground/50 text-xs max-w-md leading-relaxed">
              No se encontró un módulo de Aula Virtual asociado a tu línea de investigación ({perfil?.linea_investigacion || 'No definida'}). Contacta a un administrador para asociar tu perfil.
            </p>
          </div>
        </div>
      ) : (
        <OvaManagerView modulo={docenteModulo} />
      )}

    </div>
  );
}
