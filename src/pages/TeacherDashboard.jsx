import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerModulos } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import OvaManagerView from '../components/OvaManagerView';
import { 
  GraduationCap, 
  Loader2, 
  BookOpen, 
  Layers,
  Sparkles 
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
        <Loader2 className="w-10 h-10 animate-spin text-[#10346E]" />
        <p className="text-foreground/40 text-sm font-medium">Cargando panel de docente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* ─── Encabezado del Docente ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-[#10346E]/10 dark:bg-blue-950/40 text-[#10346E] dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-[#10346E]/20">
              Docente Asesor / Creador de Contenido
            </span>
            <span className="text-foreground/50 text-xs font-medium">
              Línea: <strong className="text-[#0F172A] dark:text-white">{perfil?.linea_investigacion || 'No asignada'}</strong>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">
            Prof. {perfil?.nombre} {perfil?.apellido}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administra y publica los Objetos Virtuales de Aprendizaje (OVAs) y evaluaciones para tu línea de investigación.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#10346E] dark:text-blue-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Módulo Asignado</p>
              <p className="text-xs font-bold text-[#10346E] dark:text-blue-300">
                {docenteModulo?.nombre || perfil?.linea_investigacion || 'Sin asignar'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Gestión de OVAs de la Línea ─── */}
      {!docenteModulo ? (
        <div className="p-16 sm:p-20 flex flex-col items-center justify-center text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Sin Línea de Investigación Asignada</h3>
          <p className="text-foreground/50 text-xs max-w-md leading-relaxed">
            No se encontró un módulo de Aula Virtual asociado a tu línea de investigación ({perfil?.linea_investigacion || 'No definida'}). Por favor contacta a un administrador para que asigne tu línea.
          </p>
        </div>
      ) : (
        <OvaManagerView modulo={docenteModulo} />
      )}

    </div>
  );
}
