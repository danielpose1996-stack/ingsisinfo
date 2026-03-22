import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Modulos from './pages/Modulos';
import Repositorio from './pages/Repositorio';
import Informacion from './pages/Informacion';
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
    </MainLayout>
  );
}

export default App;
