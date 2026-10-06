import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PasswordInput } from '../../components/PasswordInput';
import { recuperarSenha } from '../../services/authService';
import { validarCPF, validarEmail, validarTelefoneBR } from '../../utils/validators';
import { mascararCPF, mascararTelefoneBR, somenteDigitos } from '../../utils/masks';

export function RecuperarSenha() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);

    if (!validarEmail(email)) return setErro('Informe um e-mail válido');
    if (!validarCPF(cpf)) return setErro('Informe um CPF válido');
    if (!validarTelefoneBR(telefone)) return setErro('Informe um celular válido');
    if (senhaNova.length < 8) return setErro('A nova senha precisa ter pelo menos 8 caracteres');
    if (senhaNova !== confirmacao) return setErro('A confirmação não bate com a nova senha');

    setCarregando(true);
    try {
      await recuperarSenha({
        email: email.trim(),
        cpf: somenteDigitos(cpf),
        telefone: somenteDigitos(telefone),
        senhaNova,
      });
      navigate('/login', { state: { senhaRedefinida: true } });
    } catch (e2) {
      setErro(
        e2.response?.data?.erro ||
          'Não conseguimos confirmar seus dados. Verifique e-mail, CPF e telefone.',
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={aoSubmeter}>
        <div style={styles.marca}>KONECTA JÁ</div>
        <p style={styles.subtitulo}>Esqueci minha senha</p>
        <p style={styles.ajuda}>
          Pra confirmar que é você, informe o e-mail, o CPF e o celular exatamente como estão no
          seu cadastro.
        </p>

        <input
          style={styles.input}
          type="email"
          placeholder="E-mail do cadastro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="CPF (000.000.000-00)"
          value={cpf}
          onChange={(e) => setCpf(mascararCPF(e.target.value))}
        />
        <input
          style={styles.input}
          placeholder="Celular ((00) 00000-0000)"
          value={telefone}
          onChange={(e) => setTelefone(mascararTelefoneBR(e.target.value))}
        />
        <PasswordInput
          style={styles.input}
          placeholder="Nova senha (mín. 8 caracteres)"
          value={senhaNova}
          onChange={(e) => setSenhaNova(e.target.value)}
        />
        <PasswordInput
          style={styles.input}
          placeholder="Confirmar nova senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />

        {erro && <p style={styles.erro}>{erro}</p>}

        <PrimaryButton label="Redefinir senha" type="submit" loading={carregando} />

        <p style={styles.rodape}>
          Não lembra algum desses dados?{' '}
          <span style={styles.textoApoio}>Fale com o suporte pelo WhatsApp da Konecta Já.</span>
        </p>
        <p style={styles.rodape}>
          <Link style={styles.link} to="/login">
            Voltar para o login
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: 380,
    maxWidth: '100%',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 18,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  marca: { fontSize: 26, fontWeight: 900, color: 'var(--konectaja-laranja)', textAlign: 'center', letterSpacing: 1 },
  subtitulo: { textAlign: 'center', color: 'var(--konectaja-text-forte)', fontSize: 16, fontWeight: 700, margin: 0 },
  ajuda: { textAlign: 'center', color: 'var(--konectaja-muted)', fontSize: 13, marginBottom: 4 },
  input: {
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 14,
  },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, margin: 0 },
  rodape: { textAlign: 'center', fontSize: 13, color: 'var(--konectaja-muted)', marginTop: 4 },
  textoApoio: { color: 'var(--konectaja-muted)' },
  link: { color: 'var(--konectaja-azul)', fontWeight: 600, textDecoration: 'none' },
};
