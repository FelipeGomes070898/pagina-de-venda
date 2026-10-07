import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { RotaProtegida } from './components/auth/RotaProtegida';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Equipe } from './pages/equipe/Equipe';
import { Prestadores } from './pages/prestadores/Prestadores';
import { Clientes } from './pages/clientes/Clientes';
import { Pagamentos } from './pages/pagamentos/Pagamentos';
import { Financeiro } from './pages/financeiro/Financeiro';
import { Suporte } from './pages/suporte/Suporte';
import { Configuracoes } from './pages/configuracoes/Configuracoes';
import { Cupons } from './pages/cupons/Cupons';
import { Banners } from './pages/banners/Banners';

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

        <Route
          path="/prestadores"
          element={
            <RotaProtegida>
              <Layout>
                <Prestadores />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/clientes"
          element={
            <RotaProtegida>
              <Layout>
                <Clientes />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/pagamentos"
          element={
            <RotaProtegida cargosPermitidos={['dono']}>
              <Layout>
                <Pagamentos />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/financeiro"
          element={
            <RotaProtegida cargosPermitidos={['dono']}>
              <Layout>
                <Financeiro />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/cupons"
          element={
            <RotaProtegida>
              <Layout>
                <Cupons />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/banners"
          element={
            <RotaProtegida>
              <Layout>
                <Banners />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/suporte"
          element={
            <RotaProtegida>
              <Layout>
                <Suporte />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <RotaProtegida>
              <Layout>
                <Configuracoes />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
