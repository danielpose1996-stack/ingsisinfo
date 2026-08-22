import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { user, perfil, loading, authError, iniciarSesionConGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const urlError = params.get('error_description')
    ? decodeURIComponent(params.get('error_description'))
    : hash.includes('error=')
    ? 'Hubo un problema al autenticar con Google. Por favor, intenta de nuevo.'
    : '';

  const activeError = errorMessage || authError || urlError;

  // Redirección inteligente y automática según el rol del perfil
  useEffect(() => {
    if (user && perfil) {
      if (perfil.rol === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (perfil.rol === 'docente') {
        navigate('/dashboard/docente', { replace: true });
      } else {
        navigate('/dashboard/estudiante', { replace: true });
      }
    }
  }, [user, perfil, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage('');
      setIsSubmitting(true);
      await iniciarSesionConGoogle();
    } catch (err) {
      console.error("Error al iniciar sesión con Google:", err);
      setErrorMessage(err.message || 'No se pudo iniciar el proceso de autenticación con Google.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#F4F6F9] dark:bg-slate-950 font-sans antialiased selection:bg-blue-500/20">
      
      {/* Contenedor Principal / Tarjeta */}
      <div className="w-full max-w-[500px]">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] rounded-[28px] p-8 sm:p-12 transition-all">
          
          {/* Header: Escudo Académico + Badge */}
          <div className="flex items-center justify-center gap-3.5 mb-7">
            {/* Ícono de Escudo Institucional con Birrete y Libro */}
            <div className="shrink-0">
              <svg className="w-13 h-15 text-[#1E3A8A] dark:text-blue-400 drop-shadow-sm" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Contorno del escudo */}
                <path
                  d="M24 3L8 9V24C8 36.5 14.8 47.5 24 51.5C33.2 47.5 40 36.5 40 24V9L24 3Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="fill-blue-50/50 dark:fill-blue-950/30"
                />
                {/* Birrete de graduación */}
                <path
                  d="M24 14.5L15 19L24 23.5L33 19L24 14.5Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.5 21V26C18.5 26 20.8 28 24 28C27.2 28 29.5 26 29.5 26V21"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path d="M33 19V24.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                {/* Libro abierto */}
                <path
                  d="M16 34.5C18.5 33 21.5 33 24 34.5C26.5 33 29.5 33 32 34.5V42.5C29.5 41 26.5 41 24 42.5C21.5 41 18.5 41 16 42.5V34.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M24 34.5V42.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            {/* Badge de Portal */}
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#EDF2F7] dark:bg-slate-800 text-[#1E3A8A] dark:text-blue-300 text-[11px] font-bold tracking-wider uppercase">
              Portal de Aprendizaje
            </span>
          </div>

          {/* Título & Subtítulo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tight">
              SISINFO
            </h1>
            <p className="text-[#64748B] dark:text-slate-400 text-base font-normal mt-1.5">
              Semillero de Investigación
            </p>
          </div>

          {/* Estado de verificación o Botón de Acción */}
          {loading && user ? (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#1E3A8A] dark:text-blue-400 mx-auto" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Verificando credenciales institucionales...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Botón de Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3.5 py-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-slate-100 font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1E3A8A] dark:text-blue-400" />
                    Conectando con Google...
                  </span>
                ) : (
                  <>
                    {/* SVG oficial del logo de Google (G multicolor) */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar con Correo Institucional</span>
                  </>
                )}
              </button>

              {/* Mensajes de error en caso de fallo */}
              {activeError && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs animate-in zoom-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Error de acceso</p>
                    <p className="opacity-90">{activeError}</p>
                  </div>
                </div>
              )}

              {/* Separador con punto central sutil */}
              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="shrink mx-3.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                <div className="grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              {/* Nota de Seguridad Institucional */}
              <div className="text-center space-y-2.5">
                <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[13px]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Acceso Seguro UNIPAZ</span>
                </div>
                <p className="text-center text-xs text-[#64748B] dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Solo se permite el ingreso con cuentas activas pertenecientes al dominio{' '}
                  <strong className="text-[#1E3A8A] dark:text-blue-400 font-semibold">@unipaz.edu.co</strong>. Los nuevos usuarios ingresan con rol de estudiante por defecto.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Pie de página institucional */}
        <p className="mt-8 text-center text-xs text-[#64748B] dark:text-slate-500 font-normal tracking-wide">
          Instituto Universitario de la Paz – UNIPAZ
        </p>
      </div>

    </div>
  );
}
