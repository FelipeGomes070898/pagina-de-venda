import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { RotaProtegida } from './components/RotaProtegida';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Marketplace } from './pages/marketplace/Marketplace';
import { PedidoConfirmado } from './pages/pedido/PedidoConfirmado';

export default function App() {
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/cadastro" element={usuario ? <Navigate to="/" replace /> : <Register />} />

        <Route
          path="/"
          element={
            <RotaProtegida>
              <Marketplace />
            </RotaProtegida>
          }
        />
        <Route
          path="/pedido/:pedidoId"
          element={
            <RotaProtegida>
              <PedidoConfirmado />
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
