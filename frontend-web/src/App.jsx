import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { RotaProtegida } from './components/auth/RotaProtegida';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Equipe } from './pages/equipe/Equipe';

function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

export default function App() {
  const admin = useAuthStore((s) => s.admin);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={admin ? <Navigate to="/" replace /> : <Login />} />

        <Route
          path="/"
          element={
            <RotaProtegida>
              <Layout>
                <Dashboard />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/equipe"
          element={
            <RotaProtegida cargosPermitidos={['dono', 'rh']}>
              <Layout>
                <Equipe />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
