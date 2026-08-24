import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, LogOut, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';

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
    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-900 text-white shadow-xl px-4 py-2.5 transition-all duration-300 border-b border-white/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Etiqueta de Modo Simulación */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-black/30 border border-white/20 flex items-center justify-center animate-pulse">
            <FlaskConical className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-amber-200 text-[11px]">
                Modo Pruebas / Simulación de Rol
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-widest text-white">
                {simulatedRole === 'estudiante' ? 'Estudiante' : `Docente: ${simulatedLinea || 'Robótica'}`}
              </span>
            </div>
            <p className="text-[10px] text-white/80 hidden md:block">
              Navegando con permisos simulados. Los datos reales de la base de datos no se alteran.
            </p>
          </div>
        </div>

        {/* Acciones y Selector Rápido */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Selector de Rol */}
          <div className="relative">
            <select
              value={currentValue}
              onChange={handleRoleChange}
              className="bg-black/40 hover:bg-black/60 border border-white/30 text-white rounded-lg py-1.5 pl-3 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer appearance-none"
            >
              <option value="estudiante" className="bg-slate-900 text-white">🎓 Vista: Estudiante</option>
              <optgroup label="👨‍🏫 Vista: Docente por Línea" className="bg-slate-900 text-amber-200">
                {LINEAS_INVESTIGACION.map((linea) => (
                  <option key={linea} value={`docente:${linea}`} className="bg-slate-900 text-white">
                    Docente: {linea}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Botón Salir */}
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-amber-100 font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Terminar simulación y volver al panel de Administrador"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span>Salir</span>
          </button>
        </div>

      </div>
    </div>
  );
}
