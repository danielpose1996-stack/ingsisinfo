import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { ShieldAlert, ShieldCheck, AlertCircle, Loader2, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, perfil, loading, iniciarSesionConGoogle, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && perfil) {
      if (perfil.rol === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        setError('Tu cuenta de correo institucional está activa, pero no cuenta con rol de Administrador.');
      }
    }
  }, [user, perfil, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsSubmitting(true);
      await iniciarSesionConGoogle();
    } catch (err) {
      console.error("Error en login administrativo:", err);
      setError(err.message || 'Error al conectar con Google.');
      setIsSubmitting(false);
    }
  };

  if (user && perfil?.rol === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <GlassCard className="max-w-md w-full p-10 text-center border-primary/30">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 border border-primary/20">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Concedido</h2>
          <p className="text-foreground/60 text-sm">Cargando panel de gestión administrativa...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md">
        <GlassCard className="p-8 sm:p-10 border border-primary/30 shadow-xl rounded-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5 border border-primary/20 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Acceso Administrativo</h1>
            <p className="text-foreground/50 text-xs italic">Área restringida para gestión del sistema SISINFO</p>
          </div>

          <div className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-3.5 py-4 px-5 rounded-xl border border-card-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:border-primary/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting || loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Verificando credenciales...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Ingresar como Administrador</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Permiso denegado</span>
                </div>
                <p className="leading-relaxed opacity-90">{error}</p>
                {user && (
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="mt-2 text-[11px] underline font-semibold block hover:text-red-700 dark:hover:text-red-300"
                  >
                    Cerrar sesión actual ({user.email})
                  </button>
                )}
              </div>
            )}

            <div className="pt-6 border-t border-card-border text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-foreground/40 text-xs">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Solo cuentas @unipaz.edu.co con rol administrador</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Ir al inicio de sesión general
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
