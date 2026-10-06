import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Barra de navegação flutuante, fixa embaixo da tela — pedido explícito
// do usuário ("igual no PC Win 11": pílula arredondada, flutuando sobre
// o conteúdo, ícones centralizados). Substitui o NavHeader antigo (que
// ficava no topo, só texto).
const LINKS = [
  { para: '/', rotulo: 'Início', icone: '🏠' },
  { para: '/chats', rotulo: 'Chats', icone: '💬' },
  { para: '/perfil', rotulo: 'Perfil', icone: '👤' },
];

// A barra é position:fixed — não ocupa espaço no fluxo normal. Cada
// página precisa reservar o próprio padding-bottom (~96px) no container
// de conteúdo pra ela não tampar o fim da lista/formulário.
export function BottomNav() {
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  return (
    <>
      <nav style={styles.barra}>
        {LINKS.map((link) => {
          const ativo = location.pathname === link.para;
          return (
            <Link
              key={link.para}
              to={link.para}
              style={{ ...styles.item, ...(ativo ? styles.itemAtivo : {}) }}
            >
              <span style={styles.icone}>{link.icone}</span>
              <span style={styles.rotulo}>{link.rotulo}</span>
            </Link>
          );
        })}

        <div style={styles.divisor} />

        <button style={styles.item} onClick={logout}>
          <span style={styles.icone}>🚪</span>
          <span style={styles.rotulo}>Sair</span>
        </button>
      </nav>
    </>
  );
}

const styles = {
  barra: {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 20,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 50,
    maxWidth: 'calc(100vw - 24px)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '8px 16px',
    borderRadius: 14,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-muted)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  itemAtivo: {
    background: 'var(--konectaja-laranja)',
    color: '#fff',
  },
  icone: { fontSize: 20, lineHeight: 1 },
  rotulo: { fontSize: 10, fontWeight: 600 },
  divisor: { width: 1, height: 28, background: 'var(--konectaja-border)', margin: '0 2px' },
};
