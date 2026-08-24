import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, X, ChevronDown, GraduationCap, Users } from 'lucide-react';

const LINEAS_INVESTIGACION = [
  'Robótica',
  'Ingeniería de Software',
  'Ingeniería del Conocimiento',
  'Redes y Telemática',
  'Gestión de la Seguridad Informática',
  'Ingeniería Informática'
];

export default function RoleSimulationBanner() {
  const { isSimulating, simulatedRole, simulatedLinea, startSimulation, stopSimulation, realIsAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isSimulating || !realIsAdmin) return null;

  const handleRoleChange = (e) => {
    const value = e.target.value;
    if (value === 'estudiante') {
      startSimulation('estudiante');
      navigate('/dashboard/estudiante');
    } else if (value.startsWith('docente:')) {
      const linea = value.replace('docente:', '');
      startSimulation('docente', linea);
      navigate('/dashboard/docente');
    }
  };

  const handleExit = () => {
    stopSimulation();
    navigate('/dashboard/admin');
  };

  const currentValue = simulatedRole === 'estudiante' ? 'estudiante' : `docente:${simulatedLinea || 'Robótica'}`;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-[#0B1528]/95 backdrop-blur-md text-slate-200 shadow-md px-4 py-2 transition-all duration-300 border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Indicador de Estado Activo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold tracking-wider text-slate-300 text-[11px] uppercase">
              Simulación Activa
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-400/20 text-[11px] font-semibold text-blue-300 flex items-center gap-1.5">
              {simulatedRole === 'estudiante' ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Estudiante</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Docente: {simulatedLinea || 'Robótica'}</span>
                </>
              )}
            </span>
            <span className="text-[10px] text-slate-400 hidden lg:inline">
              (Sesión de evaluación no destructiva)
            </span>
          </div>
        </div>

        {/* Controles de Navegación y Salida */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Selector de Rol */}
          <div className="relative">
            <select
              value={currentValue}
              onChange={handleRoleChange}
              className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer appearance-none transition-colors"
            >
              <option value="estudiante" className="bg-slate-900 text-slate-100">Vista: Estudiante</option>
              <optgroup label="Vista: Docente por Línea" className="bg-slate-900 text-blue-300 font-semibold">
                {LINEAS_INVESTIGACION.map((linea) => (
                  <option key={linea} value={`docente:${linea}`} className="bg-slate-900 text-slate-100">
                    Docente: {linea}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Botón Salir */}
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-200 hover:text-red-300 border border-slate-700 hover:border-red-500/40 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Finalizar simulación y volver al panel de Administrador"
          >
            <X className="w-3.5 h-3.5 text-red-400" />
            <span>Finalizar</span>
          </button>
        </div>

      </div>
    </div>
  );
}
