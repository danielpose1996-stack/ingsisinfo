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
        <Loader2 className="w-8 h-8 text-[#059669] animate-spin" />
      </div>
    );
  }

  // If trying to access admin route, must be admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If trying to access protected route, must be logged in OR be admin
  if (!adminOnly && !user && !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
