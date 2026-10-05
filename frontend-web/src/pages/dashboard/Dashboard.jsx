import { useAuthStore } from '../../store/authStore';

export function Dashboard() {
  const admin = useAuthStore((s) => s.admin);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: 'var(--konectaja-text-forte)', fontSize: 22, margin: 0 }}>Olá, {admin.nome}</h1>
      <p style={{ color: 'var(--konectaja-muted)', fontSize: 13, marginTop: 8 }}>
        Próxima etapa: métricas de prestadores, clientes e receita neste dashboard.
      </p>
    </div>
  );
}
