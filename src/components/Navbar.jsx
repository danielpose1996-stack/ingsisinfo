import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, User, Menu, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';


const cn = (...inputs) => twMerge(clsx(inputs));

export default function Navbar() {
  const { user, perfil, isAdmin, logoutAdmin, cerrarSesion } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await cerrarSesion();
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Información', path: '/informacion' },
    { name: 'Módulos', path: '/modulos' },
    { name: 'Rueda', path: '/#rueda' },
    { name: 'Repositorio', path: '/repositorio' },
  ];

  const getInitial = () => {
    if (isAdmin) return 'A';
    if (perfil?.nombre) return perfil.nombre.charAt(0).toUpperCase();
    return 'U';
  };

  const getPanelLink = () => {
    if (isAdmin) return '/dashboard/admin';
    if (perfil?.rol === 'docente') return '/dashboard/docente';
    return '/dashboard/estudiante';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1E3A8A] backdrop-blur-md border-b border-blue-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              SISINFO
            </span>
          </Link>
 
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === link.path 
                      ? "text-[#22d3ee] font-bold bg-white/10" 
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Button / Avatar */}
          <div className="hidden md:flex items-center gap-4">

            {(!user && !isAdmin) ? (
              <Link 
                to="/login"
                className="px-4 py-2 rounded-full bg-[#22d3ee] hover:bg-[#06b6d4] text-white font-semibold text-sm transition-all transform hover:scale-105"
              >
                Inicio de Sesión
              </Link>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/20">
                    {getInitial()}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-white/60 transition-transform", isDropdownOpen && "rotate-180")} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-card-border shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-card-border">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {isAdmin ? 'Administrador' : (perfil?.nombre ? `${perfil.nombre} ${perfil.apellido || ''}`.trim() : 'Usuario')}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {isAdmin ? 'Sistema' : perfil?.rol || 'Usuario'}
                      </p>
                    </div>
                    
                    <Link
                      to={getPanelLink()}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-foreground/60 hover:text-foreground hover:bg-card transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Ir a mi Panel
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-[#1E3A8A]/95 backdrop-blur-xl border-b border-blue-800 px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                location.pathname === link.path 
                  ? "text-[#22d3ee] bg-white/10" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 pb-1 border-t border-card-border">
            {(!user && !isAdmin) ? (
              <Link 
                to="/login"
                className="w-full text-center block px-4 py-2 rounded-lg bg-[#059669] text-white font-bold"
                onClick={() => setIsOpen(false)}
              >
                Inicio de Sesión
              </Link>
            ) : (
              <>
                <Link
                  to={getPanelLink()}
                  className="flex items-center gap-3 px-3 py-2 text-white/80"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Ir a mi Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
