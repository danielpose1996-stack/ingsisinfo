import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Modulos = lazy(() => import('./pages/Modulos'));
const Repositorio = lazy(() => import('./pages/Repositorio'));
const Informacion = lazy(() => import('./pages/Informacion'));

import ProtectedRoute from './components/ProtectedRoute';

import { useAuth } from './context/AuthContext';

function AdminGatekeeper({ children }) {
  const { isAdmin } = useAuth();
  const hasGateKey = sessionStorage.getItem('admin_access_gate') === 'true';

  // Si ya está logueado como admin, o si viene del footer con la "llave"
  if (isAdmin || hasGateKey) {
    return children;
  }

  // De lo contrario, redirigir al inicio (ocultando que existe la ruta)
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin"></div>
          <p className="text-foreground/40 text-sm font-medium animate-pulse">Cargando...</p>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin/login" 
            element={
              <AdminGatekeeper>
                <AdminLogin />
              </AdminGatekeeper>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard/estudiante" 
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/docente" 
            element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="/repositorio" element={<Repositorio />} />
          
          <Route path="/modulos" element={<Modulos />} />
          <Route path="/informacion" element={<Informacion />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}

export default App;
