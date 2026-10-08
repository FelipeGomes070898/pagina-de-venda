import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GoogleLoginButton } from '../../components/GoogleLoginButton';
import { CepAddressInput } from '../../components/CepAddressInput';
import { PasswordInput } from '../../components/PasswordInput';
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
  const [aceiteTermos, setAceiteTermos] = useState(false);
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
    if (!aceiteTermos) {
      return setErro('É necessário aceitar os Termos de Uso e a Política de Privacidade');
    }

    try {
      await cadastrar({
        tipo,
        aceiteTermos,
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
    } catch (erro) {
      setErro(erro.response?.data?.erro || 'Não foi possível criar sua conta. Tente novamente.');
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
        <CepAddressInput
          style={styles.input}
          onSelecionar={(dados) =>
            setEndereco({ texto: dados.enderecoCompleto, cidade: dados.cidade, estado: dados.estado, lat: dados.lat, lng: dados.lng })
          }
        />
        <PasswordInput
          style={styles.input}
          placeholder="Criar senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <PasswordInput
          style={styles.input}
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
            <p style={styles.explicacaoCobranca}>
              {modeloCobranca === 'percentual'
                ? 'Você não paga nada enquanto não trabalha. A cada serviço marcado como concluído, cobramos 5% do valor combinado (o cliente continua te pagando direto, por Pix ou dinheiro). Se essa cobrança não for paga, sua conta fica temporariamente bloqueada pra novos pedidos até regularizar.'
                : 'Cobramos R$ 25,00 uma vez por mês, independente de quantos serviços você fizer naquele mês — compensa se você trabalha bastante. O cliente sempre te paga direto (Pix ou dinheiro); essa taxa é só o acesso à plataforma.'}
            </p>
          </>
        )}

        <label style={styles.aceite}>
          <input
            type="checkbox"
            checked={aceiteTermos}
            onChange={(e) => setAceiteTermos(e.target.checked)}
          />
          <span>
            Li e aceito os{' '}
            <Link style={styles.link} to="/legal/termos" target="_blank" rel="noopener noreferrer">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              style={styles.link}
              to="/legal/privacidade"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de Privacidade
            </Link>
          </span>
        </label>

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
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 22,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 24, margin: 0, textAlign: 'center' },
  subtitulo: { textAlign: 'center', color: 'var(--konectaja-muted)', fontSize: 13, marginBottom: 12 },
  avisoGoogle: {
    background: 'var(--konectaja-bg3)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 10,
    padding: 10,
    color: 'var(--konectaja-text)',
    fontSize: 12,
    textAlign: 'center',
  },
  abas: { display: 'flex', background: 'var(--konectaja-bg3)', borderRadius: 14, padding: 5, gap: 4, border: '1px solid var(--konectaja-border)' },
  aba: {
    flex: 1,
    padding: '10px 6px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-muted)',
    fontSize: 12,
    fontWeight: 700,
  },
  abaAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  input: {
    height: 48,
    borderRadius: 14,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 14,
  },
  rotulo: { color: 'var(--konectaja-text)', fontSize: 13, fontWeight: 600, margin: '4px 0 0' },
  explicacaoCobranca: { color: 'var(--konectaja-muted)', fontSize: 12, lineHeight: 1.5, margin: '4px 0 0' },
  categorias: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text)',
    fontSize: 11,
    fontWeight: 700,
  },
  chipAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    borderColor: 'var(--konectaja-laranja)',
    color: '#fff',
  },
  aceite: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12.5,
    color: 'var(--konectaja-text)',
    lineHeight: 1.5,
    marginTop: 4,
  },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, margin: 0 },
  rodape: { textAlign: 'center', fontSize: 13, color: 'var(--konectaja-muted)', marginTop: 8 },
  link: { color: 'var(--konectaja-azul)', fontWeight: 600, textDecoration: 'none' },
};
