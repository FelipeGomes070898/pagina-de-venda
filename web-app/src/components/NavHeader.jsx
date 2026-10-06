import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Cabeçalho com navegação persistente — equivalente web da barra de abas
// do mobile (Início / Chats / Perfil). Antes, cada página montava seu
// próprio header com só "nome do usuário" + "Sair", sem nenhum jeito de
// voltar pro marketplace ou chegar nos chats a não ser apertando "voltar"
// do navegador ou lembrando a URL de cor.
const LINKS = [
  { para: '/', rotulo: 'Início' },
  { para: '/chats', rotulo: 'Chats' },
  { para: '/perfil', rotulo: 'Perfil' },
];

export function NavHeader() {
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.marca}>
        KONECTA JÁ
      </Link>

      <nav style={styles.nav}>
        {LINKS.map((link) => (
          <Link
            key={link.para}
            to={link.para}
            style={{
              ...styles.link,
              ...(location.pathname === link.para ? styles.linkAtivo : {}),
            }}
          >
            {link.rotulo}
          </Link>
        ))}
      </nav>

      <button style={styles.sair} onClick={logout}>
        Sair
      </button>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid var(--konectaja-border)',
    gap: 16,
    flexWrap: 'wrap',
  },
  marca: {
    fontSize: 20,
    fontWeight: 900,
    color: 'var(--konectaja-laranja)',
    letterSpacing: 1,
    textDecoration: 'none',
  },
  nav: { display: 'flex', gap: 20, flex: 1, justifyContent: 'center' },
  link: {
    color: 'var(--konectaja-muted)',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    padding: '6px 4px',
    borderBottom: '2px solid transparent',
  },
  linkAtivo: {
    color: 'var(--konectaja-text-forte)',
    borderBottom: '2px solid var(--konectaja-laranja)',
  },
  sair: {
    background: 'transparent',
    border: '1px solid var(--konectaja-border)',
    color: 'var(--konectaja-muted)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
};
