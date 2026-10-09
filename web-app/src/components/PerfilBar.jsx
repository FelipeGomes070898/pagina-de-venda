import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Atalho rápido pro perfil, fixo no canto superior direito (espelhando
// o botão de Ajuda, que ficou no canto superior esquerdo) — visível em
// qualquer tela, sem precisar descer até o menu inferior.
export function PerfilBar() {
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();

  if (!usuario) return null;

  return (
    <button style={styles.botao} onClick={() => navigate('/perfil')} aria-label="Meu perfil">
      {usuario.foto_url ? (
        <img src={usuario.foto_url} alt={usuario.nome} style={styles.foto} />
      ) : (
        <span style={styles.inicial}>{usuario.nome?.charAt(0).toUpperCase() || '?'}</span>
      )}
    </button>
  );
}

const styles = {
  botao: {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 60,
    width: 44,
    height: 44,
    borderRadius: 999,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--konectaja-shadow-md)',
    padding: 0,
    overflow: 'hidden',
  },
  foto: { width: '100%', height: '100%', objectFit: 'cover' },
  inicial: { color: 'var(--konectaja-laranja-escuro)', fontWeight: 800, fontSize: 16 },
};
