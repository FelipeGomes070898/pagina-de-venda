import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { RotaProtegida } from './components/RotaProtegida';
import { Splash } from './components/Splash';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { RecuperarSenha } from './pages/auth/RecuperarSenha';
import { BaixarApp } from './pages/BaixarApp';
import { Legal } from './pages/legal/Legal';
import { Marketplace } from './pages/marketplace/Marketplace';
import { ProfessionalProfile } from './pages/profile/ProfessionalProfile';
import { MeuPerfil } from './pages/profile/MeuPerfil';
import { DadosPessoais } from './pages/profile/DadosPessoais';
import { MeuHistorico } from './pages/profile/MeuHistorico';
import { DadosPrestador } from './pages/profile/DadosPrestador';
import { MapaTrabalhosPagina } from './pages/profile/MapaTrabalhosPagina';
import { AreaServico } from './pages/profile/AreaServico';
import { AlbumTrabalhos } from './pages/profile/AlbumTrabalhos';
import { PrivacidadeDados } from './pages/profile/PrivacidadeDados';
import { MeusChats } from './pages/chats/MeusChats';
import { Carteira } from './pages/carteira/Carteira';
import { Chat } from './pages/chat/Chat';
import { Review } from './pages/review/Review';
import { ReviewCliente } from './pages/review/ReviewCliente';
import { AjudaBar } from './components/AjudaBar';
import { PerfilBar } from './components/PerfilBar';

export default function App() {
  const usuario = useAuthStore((s) => s.usuario);
  const [mostrarSplash, setMostrarSplash] = useState(true);

  if (mostrarSplash) {
    return <Splash onFinish={() => setMostrarSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <AjudaBar />
      <PerfilBar />
      <Routes>
        <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/cadastro" element={usuario ? <Navigate to="/" replace /> : <Register />} />
        <Route
          path="/recuperar-senha"
          element={usuario ? <Navigate to="/" replace /> : <RecuperarSenha />}
        />
        <Route path="/baixar-app" element={<BaixarApp />} />
        <Route path="/legal/:doc" element={<Legal />} />
        <Route path="/legal" element={<Navigate to="/legal/termos" replace />} />

        <Route
          path="/"
          element={
            <RotaProtegida>
              <Marketplace />
            </RotaProtegida>
          }
        />
        <Route
          path="/prestador/:prestadorId"
          element={
            <RotaProtegida>
              <ProfessionalProfile />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil"
          element={
            <RotaProtegida>
              <MeuPerfil />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil/dados-pessoais"
          element={
            <RotaProtegida>
              <DadosPessoais />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil/historico"
          element={
            <RotaProtegida>
              <MeuHistorico />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil/prestador"
          element={
            <RotaProtegida>
              <DadosPrestador />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil/mapa-trabalhos"
          element={
            <RotaProtegida>
              <MapaTrabalhosPagina />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil/area-servico"
          element={
            <RotaProtegida>
              <AreaServico />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil/album"
          element={
            <RotaProtegida>
              <AlbumTrabalhos />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil/privacidade"
          element={
            <RotaProtegida>
              <PrivacidadeDados />
            </RotaProtegida>
          }
        />
        <Route
          path="/chats"
          element={
            <RotaProtegida>
              <MeusChats />
            </RotaProtegida>
          }
        />
        <Route
          path="/carteira"
          element={
            <RotaProtegida>
              <Carteira />
            </RotaProtegida>
          }
        />
        <Route
          path="/chat/:pedidoId"
          element={
            <RotaProtegida>
              <Chat />
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliar/:pedidoId"
          element={
            <RotaProtegida>
              <Review />
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliar-cliente/:pedidoId"
          element={
            <RotaProtegida>
              <ReviewCliente />
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
