import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ICONES = {
  inicio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" /></svg>
  ),
  chats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4V5Z" /></svg>
  ),
  perfil: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" /></svg>
  ),
  sair: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="m15 16 4-4-4-4" /><path d="M19 12H9" /></svg>
  ),
};

// Barra de navegação flutuante, fixa embaixo da tela — pedido explícito
// do usuário ("igual no PC Win 11": pílula arredondada, flutuando sobre
// o conteúdo, ícones centralizados). Substitui o NavHeader antigo (que
// ficava no topo, só texto).
const LINKS = [
  { para: '/', rotulo: 'Início', icone: 'inicio' },
  { para: '/chats', rotulo: 'Chats', icone: 'chats' },
  { para: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
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
              <span style={styles.icone}>{ICONES[link.icone]}</span>
              <span style={styles.rotulo}>{link.rotulo}</span>
            </Link>
          );
        })}

        <div style={styles.divisor} />

        <button style={styles.item} onClick={logout}>
          <span style={styles.icone}>{ICONES.sair}</span>
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
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid var(--konectaja-border)',
    boxShadow: 'var(--konectaja-shadow-lg, 0 18px 44px rgba(28,25,23,.16))',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    zIndex: 50,
    maxWidth: 'calc(100vw - 24px)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '9px 16px',
    borderRadius: 16,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-muted)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  itemAtivo: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(180, 83, 9, 0.4)',
  },
  icone: { display: 'flex', lineHeight: 1 },
  rotulo: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.2 },
  divisor: { width: 1, height: 26, background: 'var(--konectaja-border)', margin: '0 2px' },
};
