import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function RotaProtegida({ cargosPermitidos, children }) {
  const admin = useAuthStore((s) => s.admin);

  if (!admin) return <Navigate to="/login" replace />;

  if (cargosPermitidos && !cargosPermitidos.includes(admin.cargo)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
