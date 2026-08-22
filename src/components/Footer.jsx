import React from 'react';
import { Mail, MapPin, Shield, Github, Facebook } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  const handleAdminGateway = (e) => {
    // Manejador de clics oculto para el acceso discreto de administradores
    if (e.detail === 2) {
      sessionStorage.setItem('admin_access_gate', 'true');
      navigate('/admin/login');
    }
  };

  return (
    <footer className="bg-[#0C1B33] text-white border-t border-white/10 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Contenido Principal en 4 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-14 pb-12 border-b border-white/10">
          
          {/* Columna 1: Identidad Institucional */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {/* Escudo lineal */}
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white tracking-wider font-display">
                SISINFO
              </span>
            </div>
            
            <p className="text-white/60 text-xs leading-relaxed max-w-xs">
              Semillero de investigación de ingeniería informática – UNIPAZ
            </p>

            {/* Iconos de Redes / Contacto */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="mailto:sisinfo@unipaz.edu.co"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                title="Correo Institucional"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/danielpose1996-stack/ingsisinfo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Columna 2: Plataforma */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-5">
              Plataforma
            </h4>
            <ul className="space-y-3 text-xs text-white/65">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/modulos" className="hover:text-white transition-colors">
                  Aula Virtual
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Estudiantes / Docentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-5">
              Contacto
            </h4>
            <ul className="space-y-3 text-xs text-white/65">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>sisinfo@unipaz.edu.co</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>UNIPAZ, Barrancabermeja</span>
              </li>
            </ul>
          </div>

          {/* Columna 4: Legal */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-5">
              Legal
            </h4>
            <ul className="space-y-3 text-xs text-white/65">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacidad de Datos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Términos Académicos
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Barra Inferior */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50">
          <p 
            onClick={handleAdminGateway}
            className="cursor-default select-none hover:text-white/70 transition-colors"
            title="SISINFO"
          >
            © {new Date().getFullYear()} SISINFO - UNIPAZ. TODOS LOS DERECHOS RESERVADOS.
          </p>
          
          <p className="text-white/60 font-medium">
            Desarrollado por el equipo de Ingeniería Informática - UNIPAZ
          </p>
        </div>

      </div>
    </footer>
  );
}
