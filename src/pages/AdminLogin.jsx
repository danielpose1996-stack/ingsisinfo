import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { ShieldAlert, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Pequeño delay artificial para seguridad y feedback visual
    setTimeout(async () => {
      try {
        const success = await loginAdmin(email, password);
        
        if (success) {
          setIsSuccess(true);
          setTimeout(() => {
            navigate('/dashboard/admin');
          }, 1500);
        } else {
          setError('Credenciales de administrador inválidas');
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error("Login error:", err);
        setError('Correo o contraseña incorrectos.');
        setIsSubmitting(false);
      }
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-md w-full p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#059669]/20 mb-6 border border-[#059669]/30">
            <Lock className="w-10 h-10 text-[#059669]" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4 italic">Acceso Concedido</h2>
          <p className="text-foreground/60">Cargando panel de gestión global...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1E3A8A]/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md">
        <GlassCard className="p-10 border-[#1E3A8A]/20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card mb-6 border border-card-border shadow-inner">
              <ShieldAlert className="w-8 h-8 text-blue-300" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2 italic tracking-tight">Acceso Administrativo</h2>
            <p className="text-foreground/40 text-sm italic">Área restringida para gestión del sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">
                  Correo Administrador
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]/50 focus:ring-1 focus:ring-[#1E3A8A]/20 transition-all font-mono"
                    placeholder="admin@unipaz.edu.co"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 px-1 italic">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-[#1E3A8A]/50 focus:ring-1 focus:ring-[#1E3A8A]/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="secondary"
              className="w-full py-4 rounded-xl text-base shadow-xl shadow-[#1E3A8A]/10 italic font-bold tracking-widest"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
                </span>
              ) : (
                'EXPLORAR PANEL'
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-card-border text-center">
             <button 
              onClick={() => navigate('/login')}
              className="text-xs text-[#1E3A8A]/60 hover:text-[#1E3A8A] dark:text-blue-400/60 dark:hover:text-blue-400 transition-colors uppercase tracking-widest font-bold italic"
             >
               Regresar al acceso público
             </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}


