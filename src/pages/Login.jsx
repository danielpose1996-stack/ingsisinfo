import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import RoleSelector from '../components/RoleSelector';
import Button from '../components/Button';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useEmailValidation } from '../hooks/useEmailValidation';

export default function Login() {
  const [role, setRole] = useState('estudiante');
  const { email, error: emailError, isValid: isEmailValid, handleChange: handleEmailChange, getNormalizedEmail } = useEmailValidation('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFailsafe, setShowFailsafe] = useState(false);
  const { user, perfil } = useAuth();
  const navigate = useNavigate();

  // Failsafe timer if it hangs in "Verificando..."
  React.useEffect(() => {
    let timer;
    if (isSubmitting) {
      timer = setTimeout(() => setShowFailsafe(true), 4000);
    } else {
      setShowFailsafe(false);
    }
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  const handleNavigate = (p) => {
    if (!p) return;
    if (p.rol === 'admin') navigate('/dashboard/admin');
    else navigate(p.rol === 'docente' ? '/dashboard/docente' : '/dashboard/estudiante');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setShowFailsafe(false);

    try {
      const cleanEmail = getNormalizedEmail();
      const cleanPassword = password.trim();
      
      // 1. Auth directo
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (authError) throw authError;

      // 2. Fetch de perfil inmediato (Speedy pattern)
      const { data: p, error: pError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (p) {
        handleNavigate(p);
      } else {
        // Si no hay perfil inmediato, esperamos al AuthContext
        console.warn("Perfil no encontrado inmediatamente, esperando a context...");
        setTimeout(() => {
          if (!perfil) {
            setError('Tu cuenta no tiene un perfil asociado. Contacta al administrador.');
            setIsSubmitting(false);
          }
        }, 3000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos.' 
        : 'Error en el inicio de sesión: ' + err.message);
      setIsSubmitting(false);
    }
  };

  // Fallback si el perfil llega por el contexto tarde
  React.useEffect(() => {
    if (isSubmitting && perfil) {
      handleNavigate(perfil);
    }
  }, [perfil, isSubmitting]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <GlassCard className="p-8 bg-card border border-card-border shadow-md rounded-xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">Inicio de Sesión</h2>
            <p className="text-foreground/60 text-sm italic">Accede a tu plataforma SISINFO</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3 px-1 italic">
                Selecciona tu Rol
              </label>
              <RoleSelector selectedRole={role} onRoleChange={setRole} />
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1.5 px-1 italic">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full bg-card border rounded-lg py-3.5 pl-11 pr-4 text-sm text-foreground focus:outline-none transition-all ${
                      emailError 
                        ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' 
                        : 'border-card-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
                    }`}
                    placeholder="tu@unipaz.edu.co"
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-[10px] text-red-500 font-bold italic mt-1 px-1">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest mb-1.5 px-1 italic">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-lg py-3.5 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in zoom-in duration-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
                {showFailsafe && (
                  <button 
                    type="button" 
                    onClick={() => window.location.reload()}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-dark mt-1 text-left px-6"
                  >
                    ¿Sigue cargando? Haz clic aquí para reintentar
                  </button>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !isEmailValid || !email}
              className="w-full py-4 rounded-lg text-base shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {showFailsafe && !error && (
            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-bold text-primary hover:text-primary-dark bg-blue-50/50 border border-blue-100 py-2 px-4 rounded-lg transition-all animate-in fade-in slide-in-from-top-2"
              >
                ¿Demora mucho? Click para recargar sesión
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-foreground/50 italic px-4">
            ¿Olvidaste tu contraseña? Contacta con el administrador del semillero.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

