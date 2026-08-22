import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ITENS_MENU = [
  { rota: '/', label: 'Dashboard', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/prestadores', label: 'Prestadores', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/clientes', label: 'Clientes', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/financeiro', label: 'Financeiro', cargos: ['dono'] },
  { rota: '/pagamentos', label: 'Pagamentos', cargos: ['dono'] },
  { rota: '/equipe', label: 'Equipe', cargos: ['dono', 'rh'] },
  { rota: '/suporte', label: 'Suporte', cargos: ['dono', 'rh', 'gerente', 'atendimento'] },
  { rota: '/configuracoes', label: 'Configurações', cargos: ['dono'] },
];

export function Sidebar() {
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);

  if (!admin) return null;

  const itensVisiveis = ITENS_MENU.filter((item) => item.cargos.includes(admin.cargo));

  return (
    <aside style={styles.aside}>
      <div style={styles.marca}>
        Vex<span style={styles.marcaDestaque}>o</span>
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
    background: 'var(--vexo-bg3)',
    borderRight: '1px solid var(--vexo-border)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  marca: { fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 24 },
  marcaDestaque: { color: 'var(--vexo-laranja)' },
  perfil: { marginBottom: 24 },
  perfilNome: { color: '#fff', fontWeight: 700, fontSize: 14 },
  perfilCargo: { color: 'var(--vexo-muted)', fontSize: 12, marginTop: 2 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  link: {
    padding: '10px 12px',
    borderRadius: 8,
    color: 'var(--vexo-text)',
    textDecoration: 'none',
    fontSize: 14,
  },
  linkAtivo: { background: 'var(--vexo-roxo)', color: '#fff' },
  sair: {
    background: 'transparent',
    border: '1px solid var(--vexo-border)',
    color: 'var(--vexo-muted)',
    borderRadius: 8,
    padding: 10,
    cursor: 'pointer',
  },
};
