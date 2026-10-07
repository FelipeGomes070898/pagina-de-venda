import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ITENS_MENU = [
  { rota: '/', label: 'Dashboard', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/prestadores', label: 'Prestadores', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/clientes', label: 'Clientes', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/financeiro', label: 'Financeiro', cargos: ['dono'] },
  { rota: '/pagamentos', label: 'Pagamentos', cargos: ['dono'] },
  { rota: '/cupons', label: 'Cupons', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/banners', label: 'Banners', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/equipe', label: 'Equipe', cargos: ['dono', 'rh'] },
  { rota: '/suporte', label: 'Suporte', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  {
    rota: '/configuracoes',
    label: 'Configurações',
    cargos: ['dono', 'rh', 'gerente', 'atendimento'],
  },
];

export function Sidebar() {
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);

  if (!admin) return null;

  const itensVisiveis = ITENS_MENU.filter((item) => item.cargos.includes(admin.cargo));

  return (
    <aside style={styles.aside}>
      <div style={styles.marca}>
        KONECTA JÁ
      </div>

      <div style={styles.perfil}>
        <div style={styles.perfilNome}>{admin.nome}</div>
        <div style={styles.perfilCargo}>{rotuloCargo(admin.cargo)}</div>
      </div>

      <nav style={styles.nav}>
        {itensVisiveis.map((item) => (
          <NavLink
            key={item.rota}
            to={item.rota}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.linkAtivo : {}),
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button style={styles.sair} onClick={logout}>
        Sair
      </button>
    </aside>
  );
}

function rotuloCargo(cargo) {
  const rotulos = {
    dono: 'Dono',
    rh: 'RH',
    gerente: 'Gerente',
    atendimento: 'Atendimento',
  };
  return rotulos[cargo] || cargo;
}

const styles = {
  aside: {
    width: 220,
    minHeight: '100vh',
    background: 'var(--konectaja-bg2)',
    borderRight: '1px solid var(--konectaja-border)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  marca: { fontSize: 22, fontWeight: 900, color: 'var(--konectaja-laranja-escuro)', marginBottom: 24, letterSpacing: 1 },
  perfil: { marginBottom: 24 },
  perfilNome: { color: 'var(--konectaja-text-forte)', fontWeight: 700, fontSize: 14 },
  perfilCargo: { color: 'var(--konectaja-muted)', fontSize: 12, marginTop: 2 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  link: {
    padding: '10px 12px',
    borderRadius: 10,
    color: 'var(--konectaja-text)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  linkAtivo: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  sair: {
    background: 'transparent',
    border: '1px solid var(--konectaja-border)',
    color: 'var(--konectaja-muted)',
    borderRadius: 10,
    padding: 10,
    cursor: 'pointer',
    fontWeight: 600,
  },
};
