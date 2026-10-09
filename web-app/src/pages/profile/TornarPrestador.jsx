import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { useAuthStore } from '../../store/authStore';
import { tornarPrestador } from '../../services/authService';
import { CATEGORIAS } from '../../constants/categorias';
import { mensagemErro } from '../../utils/erro';

// Cliente que também quer trabalhar: não gera uma segunda conta, nem
// pede senha de novo — reaproveita nome/e-mail/telefone/CPF/senha de
// quem já é cliente. Só pergunta o que é específico de ser prestador
// (o que vai oferecer, valor, como prefere pagar a taxa da
// plataforma). Depois de enviar, o app já entra direto no "modo
// prestador" — ver trocarPapel/definirSessao.
export function TornarPrestador() {
  const definirSessao = useAuthStore((s) => s.definirSessao);
  const navigate = useNavigate();

  const [segmento, setSegmento] = useState('');
  const [valorServico, setValorServico] = useState('');
  const [modeloCobranca, setModeloCobranca] = useState('percentual');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  async function aoEnviar(e) {
    e.preventDefault();
    if (!segmento.trim()) return setErro('Informe o serviço que você vai oferecer');

    setEnviando(true);
    setErro(null);
    try {
      const { token, usuario } = await tornarPrestador({
        segmento: segmento.trim(),
        valorServico: valorServico ? Number(valorServico.replace(',', '.')) : undefined,
        modeloCobranca,
      });
      definirSessao({ token, usuario });
      navigate('/');
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível ativar seu perfil de prestador agora.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Quero também trabalhar" />
      <div style={styles.container}>
        <p style={styles.ajuda}>
          Seus dados de cadastro (nome, e-mail, telefone, CPF) são reaproveitados — você não cria uma
          conta nova nem precisa de outra senha. Só falta dizer o que você vai oferecer.
        </p>

        <form style={styles.form} onSubmit={aoEnviar}>
          <label style={styles.rotulo}>O que você vai oferecer</label>
          <input
            style={styles.input}
            placeholder="Ex.: Encanador, Diarista, Pedreiro..."
            list="categorias-sugestao"
            value={segmento}
            onChange={(e) => setSegmento(e.target.value)}
          />
          <datalist id="categorias-sugestao">
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>

          <label style={styles.rotulo}>Valor do seu serviço (R$, opcional)</label>
          <input
            style={styles.input}
            placeholder="Negociável no chat"
            value={valorServico}
            onChange={(e) => setValorServico(e.target.value)}
          />

          <label style={styles.rotulo}>Como prefere pagar a taxa da plataforma?</label>
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
          <p style={styles.explicacao}>
            {modeloCobranca === 'percentual'
              ? 'Você não paga nada enquanto não trabalha. A cada serviço concluído, cobramos 5% do valor combinado.'
              : 'Cobramos R$ 25,00 uma vez por mês, independente de quantos serviços você fizer — compensa se você trabalha bastante.'}
          </p>

          {erro && <p style={styles.erro}>{erro}</p>}

          <button style={styles.botaoPrimario} type="submit" disabled={enviando}>
            {enviando ? 'Ativando...' : 'Começar a trabalhar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '20px 24px 48px' },
  ajuda: { color: 'var(--konectaja-muted)', fontSize: 12.5, lineHeight: 1.5, marginTop: 0, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 8 },
  rotulo: { color: 'var(--konectaja-text-forte)', fontSize: 13, fontWeight: 700, marginTop: 10 },
  input: {
    height: 46,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 14,
  },
  abas: { display: 'flex', gap: 8 },
  aba: {
    flex: 1,
    padding: '12px 8px',
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text)',
    fontSize: 12.5,
    fontWeight: 700,
    textAlign: 'center',
  },
  abaAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    borderColor: 'var(--konectaja-laranja)',
    color: '#fff',
  },
  explicacao: { color: 'var(--konectaja-muted)', fontSize: 12, lineHeight: 1.5, margin: '2px 0 0' },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, margin: 0 },
  botaoPrimario: {
    height: 48,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 12,
  },
};
