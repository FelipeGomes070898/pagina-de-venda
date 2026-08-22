import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function RotaProtegida({ children }) {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}
