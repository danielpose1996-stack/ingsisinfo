import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const cleanEmail = getNormalizedEmail();
      const cleanPassword = password.trim();
      
      const data = await iniciarSesion(cleanEmail, cleanPassword);
      
      if (data) {
        setTimeout(() => {
          navigate(role === 'estudiante' ? '/dashboard/estudiante' : '/dashboard/docente');
        }, 500);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Credenciales incorrectas o error en el inicio de sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <GlassCard className="p-8">
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
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full bg-card border rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground focus:outline-none transition-all ${
                      emailError 
                        ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' 
                        : 'border-card-border focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'
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
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in zoom-in duration-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !isEmailValid || !email}
              className="w-full py-4 rounded-xl text-base shadow-xl shadow-emerald-500/10"
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

          <p className="mt-8 text-center text-xs text-foreground/50 italic px-4">
            ¿Olvidaste tu contraseña? Contacta con el administrador del semillero.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

