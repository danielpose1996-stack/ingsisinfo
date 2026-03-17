import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Modulos from './pages/Modulos';
import Repositorio from './pages/Repositorio';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
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

        <Route 
          path="/repositorio" 
          element={
            <ProtectedRoute>
              <Repositorio />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/modulos" element={<Modulos />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
