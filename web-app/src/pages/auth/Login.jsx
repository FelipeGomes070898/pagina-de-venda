import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { validarIdentificador } from '../../utils/validators';
import { mascararCPF, mascararTelefoneBR, somenteDigitos } from '../../utils/masks';

const ABAS = [
  { tipo: 'telefone', label: 'Celular', placeholder: '(00) 00000-0000' },
  { tipo: 'email', label: 'E-mail', placeholder: 'seuemail@exemplo.com' },
  { tipo: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
];

export function Login() {
  const { login, lembrarLogin, setLembrarLogin, carregando } = useAuthStore();
  const navigate = useNavigate();

  const [aba, setAba] = useState('telefone');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);

  const abaAtual = ABAS.find((a) => a.tipo === aba);

  function trocarAba(tipo) {
    setAba(tipo);
    setIdentificador('');
    setErro(null);
  }

  function aoDigitarIdentificador(valor) {
    if (aba === 'telefone') setIdentificador(mascararTelefoneBR(valor));
    else if (aba === 'cpf') setIdentificador(mascararCPF(valor));
    else setIdentificador(valor);
  }

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);

    if (!validarIdentificador(aba, identificador)) {
      setErro('Informe um dado válido para continuar');
      return;
    }
    if (!senha) {
      setErro('Digite sua senha');
      return;
    }

    const valorLimpo = aba === 'email' ? identificador.trim() : somenteDigitos(identificador);

    try {
      await login({ identificador: valorLimpo, tipoIdentificador: aba, senha });
      navigate('/');
    } catch {
      setErro('Não foi possível entrar. Verifique seus dados.');
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={aoSubmeter}>
        <div style={styles.marca}>
          Vex<span style={styles.marcaDestaque}>o</span>
        </div>
        <p style={styles.subtitulo}>Serviços. Pessoas. Conexões reais.</p>

        <div style={styles.abas}>
          {ABAS.map((item) => (
            <button
              type="button"
              key={item.tipo}
              style={{ ...styles.aba, ...(aba === item.tipo ? styles.abaAtiva : {}) }}
              onClick={() => trocarAba(item.tipo)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <input
          style={styles.input}
          placeholder={abaAtual.placeholder}
          value={identificador}
          onChange={(e) => aoDigitarIdentificador(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {erro && <p style={styles.erro}>{erro}</p>}

        <label style={styles.lembrarWrapper}>
          <input
            type="checkbox"
            checked={lembrarLogin}
            onChange={(e) => setLembrarLogin(e.target.checked)}
          />
          <span style={styles.lembrarTexto}>Salvar login</span>
        </label>

        <PrimaryButton label="Entrar" type="submit" loading={carregando} />

        <p style={styles.rodape}>
          Ainda não tem conta? <Link style={styles.link} to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: 360,
    maxWidth: '100%',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 18,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  marca: { fontSize: 30, fontWeight: 900, color: '#fff', textAlign: 'center' },
  marcaDestaque: { color: 'var(--vexo-laranja)' },
  subtitulo: { textAlign: 'center', color: 'var(--vexo-muted)', fontSize: 13, marginBottom: 12 },
  abas: { display: 'flex', background: 'var(--vexo-bg3)', borderRadius: 12, padding: 4, gap: 4 },
  aba: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--vexo-muted)',
    fontSize: 12,
    fontWeight: 600,
  },
  abaAtiva: { background: 'var(--vexo-roxo)', color: '#fff' },
  input: {
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg3)',
    color: '#fff',
    padding: '0 14px',
    fontSize: 14,
  },
  erro: { color: 'var(--vexo-red)', fontSize: 13, margin: 0 },
  lembrarWrapper: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--vexo-text)' },
  lembrarTexto: {},
  rodape: { textAlign: 'center', fontSize: 13, color: 'var(--vexo-muted)', marginTop: 8 },
  link: { color: 'var(--vexo-laranja)', fontWeight: 600, textDecoration: 'none' },
};
