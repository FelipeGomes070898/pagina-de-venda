import { useNavigate } from 'react-router-dom';

// Cabeçalho simples de "voltar + título", usado pelas sub-páginas do
// perfil (Dados pessoais, Área de serviço, etc.) — mesmo padrão visual
// do header do Chat, só que sempre volta pro hub do perfil.
export function SubPaginaHeader({ titulo, voltarPara = '/perfil' }) {
  const navigate = useNavigate();
  return (
    <div style={styles.header}>
      <button style={styles.voltar} onClick={() => navigate(voltarPara)} aria-label="Voltar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1 style={styles.titulo}>{titulo}</h1>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderBottom: '1px solid var(--konectaja-border)',
    background: 'rgba(255,255,255,.85)',
    backdropFilter: 'blur(14px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  voltar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 16, fontWeight: 800, margin: 0 },
};
