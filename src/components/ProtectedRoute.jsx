import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
      </div>
    );
  }

  // Para acceder a una ruta de administración se debe poseer el rol de administrador
  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Para acceder a una ruta protegida se debe haber iniciado sesión o ser administrador
  if (!adminOnly && !user && !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
