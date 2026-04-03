import { Mail, Phone, MapPin, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  const handleAdminGateway = (e) => {
    // Hidden click handler for admins
    if (e.detail === 2) { // Double click as extra layer of "discretion"
      sessionStorage.setItem('admin_access_gate', 'true');
      navigate('/admin/login');
    }
  };

  return (
    <footer className="relative border-t border-white/10 pt-20 pb-10 overflow-hidden"
      style={{ backgroundImage: "url('/footer-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/85 via-[#0a1628]/80 to-[#0a1628]/90 z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#059669]/15 flex items-center justify-center border border-[#059669]/30">
                 <Shield className="w-6 h-6 text-[#059669]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight italic">SISINFO</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed italic">
              Semillero de investigación de ingeniería informática - UNIPAZ
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6 italic">Plataforma</h4>
            <ul className="space-y-4 text-sm text-white/50 font-medium italic">
              <li><a href="/" className="hover:text-[#6ee7b7] transition-colors">Inicio</a></li>
              <li><a href="/modulos" className="hover:text-[#6ee7b7] transition-colors">Aula Virtual</a></li>
              <li><a href="/login" className="hover:text-[#6ee7b7] transition-colors">Estudiantes / Docentes</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6 italic">Contacto</h4>
            <ul className="space-y-4 text-sm text-white/50 italic">
              <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#059669]/70" /> sisinfo@unipaz.edu.co</li>
              
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[#059669]/70" /> UNIPAZ, Barrancabermeja</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6 italic">Legal</h4>
            <ul className="space-y-4 text-sm text-white/50 italic">
              <li><a href="#" className="hover:text-[#6ee7b7] transition-colors">Privacidad de Datos</a></li>
              <li><a href="#" className="hover:text-[#6ee7b7] transition-colors">Términos Académicos</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p 
            className="text-[10px] text-white/50 font-bold uppercase tracking-tighter italic cursor-default select-none"
            onClick={handleAdminGateway}
            title="© SISINFO"
          >
            © {new Date().getFullYear()} SISINFO - UNIPAZ. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
             <div className="h-6 w-px bg-white/10" />
             <p className="text-[10px] text-white/70 font-black italic tracking-widest underline decoration-[#059669]/30">Desarrollado por Daniel Posse y Mateo Mont</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

