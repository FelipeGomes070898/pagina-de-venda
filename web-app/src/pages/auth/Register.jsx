import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GoogleLoginButton } from '../../components/GoogleLoginButton';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { validarCPF, validarEmail, validarTelefoneBR } from '../../utils/validators';
import { mascararCPF, mascararTelefoneBR, somenteDigitos } from '../../utils/masks';
import { CATEGORIAS } from '../../constants/categorias';
import { loginComGoogle } from '../../services/googleAuthService';

export function Register() {
  const { cadastrar, carregando, definirSessao } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const perfilGoogle = location.state?.perfilGoogle || null;

  const [tipo, setTipo] = useState('cliente');
  const [nome, setNome] = useState(perfilGoogle?.nome || '');
  const [email, setEmail] = useState(perfilGoogle?.email || '');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState({ texto: '', cidade: '', estado: '', lat: null, lng: null });
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [segmento, setSegmento] = useState(null);
  const [valorServico, setValorServico] = useState('');
  const [modeloCobranca, setModeloCobranca] = useState('percentual');
  const [erro, setErro] = useState(null);

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);

    if (!nome.trim()) return setErro('Informe seu nome completo');
    if (!validarEmail(email)) return setErro('Informe um e-mail válido');
    if (!validarTelefoneBR(telefone)) return setErro('Informe um celular válido');
    if (!validarCPF(cpf)) return setErro('Informe um CPF válido');
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres');
    if (senha !== confirmarSenha) return setErro('As senhas não coincidem');
    if (tipo === 'prestador' && !segmento) return setErro('Escolha o serviço que você oferece');

    try {
      await cadastrar({
        tipo,
        nome: nome.trim(),
        email: email.trim(),
        telefone: somenteDigitos(telefone),
        cpf: somenteDigitos(cpf),
        senha,
        cidade: endereco.cidade || endereco.texto.trim() || undefined,
        estado: endereco.estado || undefined,
        lat: endereco.lat || undefined,
        lng: endereco.lng || undefined,
        segmento: tipo === 'prestador' ? segmento : undefined,
        valorServico: tipo === 'prestador' && valorServico ? Number(valorServico.replace(',', '.')) : undefined,
        modeloCobranca: tipo === 'prestador' ? modeloCobranca : undefined,
        googleId: perfilGoogle?.googleId || undefined,
      });
      navigate('/');
    } catch {
      setErro('Não foi possível criar sua conta. Tente novamente.');
    }
  }

  async function aoReceberCredentialGoogle(idToken) {
    setErro(null);
    try {
      const resultado = await loginComGoogle(idToken);
      if (resultado.novoCadastro) {
        setNome(resultado.perfilGoogle.nome || '');
        setEmail(resultado.perfilGoogle.email || '');
        navigate('/cadastro', { state: { perfilGoogle: resultado.perfilGoogle }, replace: true });
      } else {
        definirSessao(resultado);
        navigate('/');
      }
    } catch {
      setErro('Não foi possível continuar com o Google.');
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={aoSubmeter}>
        <h1 style={styles.titulo}>Criar conta</h1>
        <p style={styles.subtitulo}>Cadastro nacional — Brasil</p>

        {perfilGoogle && (
          <p style={styles.avisoGoogle}>
            Continuando com a conta Google de <strong>{perfilGoogle.email}</strong>. Falta só
            completar os dados abaixo (exigidos para o cadastro nacional).
          </p>
        )}

        <div style={styles.abas}>
          <button type="button" style={{ ...styles.aba, ...(tipo === 'cliente' ? styles.abaAtiva : {}) }} onClick={() => setTipo('cliente')}>
            Sou cliente
          </button>
          <button type="button" style={{ ...styles.aba, ...(tipo === 'prestador' ? styles.abaAtiva : {}) }} onClick={() => setTipo('prestador')}>
            Sou prestador de serviço
          </button>
        </div>

        <input
          style={styles.input}
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          readOnly={!!perfilGoogle}
        />
        <input
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={!!perfilGoogle}
        />
        <input
          style={styles.input}
          placeholder="Celular (00) 00000-0000"
          value={telefone}
          onChange={(e) => setTelefone(mascararTelefoneBR(e.target.value))}
        />
        <input
          style={styles.input}
          placeholder="CPF (000.000.000-00)"
          value={cpf}
          onChange={(e) => setCpf(mascararCPF(e.target.value))}
        />
        <AddressAutocompleteInput
          style={styles.input}
          placeholder="Cidade ou endereço"
          value={endereco.texto}
          onChange={(texto) => setEndereco((s) => ({ ...s, texto }))}
          onSelecionar={(dados) =>
            setEndereco({ texto: dados.enderecoCompleto, cidade: dados.cidade, estado: dados.estado, lat: dados.lat, lng: dados.lng })
          }
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Criar senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Confirmar senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
        />

        {tipo === 'prestador' && (
          <>
            <p style={styles.rotulo}>Qual serviço você oferece?</p>
            <div style={styles.categorias}>
              {CATEGORIAS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  style={{ ...styles.chip, ...(segmento === cat ? styles.chipAtiva : {}) }}
                  onClick={() => setSegmento(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              style={styles.input}
              placeholder="Valor do seu serviço (R$)"
              value={valorServico}
              onChange={(e) => setValorServico(e.target.value)}
            />

            <p style={styles.rotulo}>Como prefere pagar a taxa da plataforma?</p>
            <div style={styles.abas}>
              <button
                type="button"
                style={{ ...styles.aba, ...(modeloCobranca === 'percentual' ? styles.abaAtiva : {}) }}
                onClick={() => setModeloCobranca('percentual')}
              >
                5% por serviço concluído
              </button>
              <button
                type="button"
                style={{ ...styles.aba, ...(modeloCobranca === 'fixo_mensal' ? styles.abaAtiva : {}) }}
                onClick={() => setModeloCobranca('fixo_mensal')}
              >
                R$ 25,00 fixo por mês
              </button>
            </div>
          </>
        )}

        {erro && <p style={styles.erro}>{erro}</p>}

        <PrimaryButton label="Criar conta" type="submit" loading={carregando} />

        {!perfilGoogle && <GoogleLoginButton onCredential={aoReceberCredentialGoogle} />}

        <p style={styles.rodape}>
          Já tem conta? <Link style={styles.link} to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: 420,
    maxWidth: '100%',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 18,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  titulo: { color: '#fff', fontSize: 24, margin: 0, textAlign: 'center' },
  subtitulo: { textAlign: 'center', color: 'var(--vexo-muted)', fontSize: 13, marginBottom: 12 },
  avisoGoogle: {
    background: 'var(--vexo-bg3)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 10,
    padding: 10,
    color: 'var(--vexo-text)',
    fontSize: 12,
    textAlign: 'center',
  },
  abas: { display: 'flex', background: 'var(--vexo-bg3)', borderRadius: 12, padding: 4, gap: 4 },
  aba: {
    flex: 1,
    padding: '10px 6px',
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
  rotulo: { color: 'var(--vexo-text)', fontSize: 13, fontWeight: 600, margin: '4px 0 0' },
  categorias: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg3)',
    color: 'var(--vexo-text)',
    fontSize: 12,
  },
  chipAtiva: { background: 'var(--vexo-roxo)', borderColor: 'var(--vexo-roxo)', color: '#fff' },
  erro: { color: 'var(--vexo-red)', fontSize: 13, margin: 0 },
  rodape: { textAlign: 'center', fontSize: 13, color: 'var(--vexo-muted)', marginTop: 8 },
  link: { color: 'var(--vexo-laranja)', fontWeight: 600, textDecoration: 'none' },
};
