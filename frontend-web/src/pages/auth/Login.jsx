import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch {
      setErro('E-mail ou senha inválidos');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={aoSubmeter}>
        <div style={styles.marca}>
          LABUTA
        </div>
        <p style={styles.subtitulo}>Painel administrativo</p>

        <input
          style={styles.input}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {erro && <p style={styles.erro}>{erro}</p>}

        <button style={styles.botao} type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 340,
    background: 'var(--labuta-bg2)',
    border: '1px solid var(--labuta-border)',
    borderRadius: 16,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  marca: { fontSize: 28, fontWeight: 900, color: 'var(--labuta-laranja)', textAlign: 'center', letterSpacing: 1 },
  subtitulo: {
    textAlign: 'center',
    color: 'var(--labuta-muted)',
    fontSize: 13,
    marginBottom: 12,
  },
  input: {
    height: 44,
    borderRadius: 10,
    border: '1px solid var(--labuta-border)',
    background: 'var(--labuta-bg3)',
    color: 'var(--labuta-text-forte)',
    padding: '0 12px',
    fontSize: 14,
  },
  erro: { color: 'var(--labuta-red)', fontSize: 13, margin: 0 },
  botao: {
    height: 44,
    borderRadius: 10,
    border: 'none',
    background: 'var(--labuta-laranja)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
};
