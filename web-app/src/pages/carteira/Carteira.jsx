import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from '../../components/BottomNav';
import { meuSaldo, meuExtrato, meuDashboard, depositar, sacar } from '../../services/carteiraService';
import { minhasMetas, definirMeta, removerMeta } from '../../services/metaService';
import { mensagemErro } from '../../utils/erro';

const ROTULOS_TIPO = {
  deposito: 'Depósito',
  pagamento_enviado: 'Pagamento de serviço',
  pagamento_recebido: 'Recebimento de serviço',
  saque: 'Saque',
  estorno: 'Estorno',
};

const TIPOS_CHAVE_PIX = [
  { valor: 'CPF', rotulo: 'CPF' },
  { valor: 'EMAIL', rotulo: 'E-mail' },
  { valor: 'PHONE', rotulo: 'Telefone' },
  { valor: 'EVP', rotulo: 'Chave aleatória' },
];

function formatarValor(valor) {
  const numero = Number(valor);
  const sinal = numero > 0 ? '+' : '';
  return `${sinal}R$ ${numero.toFixed(2)}`;
}

// Mesmo tamanho de página do backend (ver CarteiraTransacao.extrato) —
// serve só pra saber se a última página veio "cheia" (provavelmente
// tem mais) ou "incompleta" (essa foi a última).
const ITENS_POR_PAGINA_EXTRATO = 30;

export function Carteira() {
  const souPrestador = useAuthStore((s) => s.usuario?.tipo === 'prestador');

  const [saldo, setSaldo] = useState(null);
  const [extrato, setExtrato] = useState([]);
  const [paginaExtrato, setPaginaExtrato] = useState(1);
  const [temMaisExtrato, setTemMaisExtrato] = useState(false);
  const [carregandoMaisExtrato, setCarregandoMaisExtrato] = useState(false);
  const [porMes, setPorMes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [modal, setModal] = useState(null); // 'depositar' | 'sacar' | null
  const [valorDigitado, setValorDigitado] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('CPF');
  const [processando, setProcessando] = useState(false);
  const [erroModal, setErroModal] = useState(null);
  const [linkPagamento, setLinkPagamento] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    setErro(null);
    Promise.all([
      meuSaldo(),
      meuExtrato(1),
      souPrestador ? meuDashboard() : Promise.resolve({ porMes: [] }),
    ])
      .then(([saldoResp, extratoResp, dashboardResp]) => {
        setSaldo(saldoResp.saldo);
        setExtrato(extratoResp);
        setPaginaExtrato(1);
        setTemMaisExtrato(extratoResp.length === ITENS_POR_PAGINA_EXTRATO);
        setPorMes(dashboardResp.porMes);
      })
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar sua carteira.')))
      .finally(() => setCarregando(false));
  }

  // Extrato só vem com as últimas 30 por padrão (ver CarteiraTransacao.extrato
  // no backend) — sem isso, quem tem mais movimentação que isso nunca
  // conseguia ver nada além das mais recentes.
  async function carregarMaisExtrato() {
    setCarregandoMaisExtrato(true);
    try {
      const proximaPagina = paginaExtrato + 1;
      const novosItens = await meuExtrato(proximaPagina);
      setExtrato((atual) => [...atual, ...novosItens]);
      setPaginaExtrato(proximaPagina);
      setTemMaisExtrato(novosItens.length === ITENS_POR_PAGINA_EXTRATO);
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível carregar mais movimentações.'));
    } finally {
      setCarregandoMaisExtrato(false);
    }
  }

  function abrirModal(tipo) {
    setModal(tipo);
    setValorDigitado('');
    setChavePix('');
    setTipoChavePix('CPF');
    setErroModal(null);
    setLinkPagamento(null);
  }

  function fecharModal() {
    setModal(null);
  }

  async function aoConfirmarDeposito(e) {
    e.preventDefault();
    const valor = Number(valorDigitado.replace(',', '.'));
    if (!valor || valor <= 0) return setErroModal('Informe um valor válido');

    setProcessando(true);
    setErroModal(null);
    try {
      const resultado = await depositar(valor);
      setLinkPagamento(resultado.invoiceUrl);
    } catch (erro) {
      setErroModal(mensagemErro(erro, 'Não foi possível gerar o depósito.'));
    } finally {
      setProcessando(false);
    }
  }

  async function aoConfirmarSaque(e) {
    e.preventDefault();
    const valor = Number(valorDigitado.replace(',', '.'));
    if (!valor || valor <= 0) return setErroModal('Informe um valor válido');
    if (!chavePix.trim()) return setErroModal('Informe sua chave Pix');

    setProcessando(true);
    setErroModal(null);
    try {
      await sacar({ valor, chavePix: chavePix.trim(), tipoChavePix });
      fecharModal();
      carregar();
    } catch (erro) {
      setErroModal(mensagemErro(erro, 'Não foi possível processar o saque.'));
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div style={styles.pagina}>
      <BottomNav />

      <main style={styles.container}>
        <h1 style={styles.titulo}>Carteira</h1>

        {erro && <p style={styles.erro}>{erro}</p>}

        <div style={styles.cardSaldo}>
          <span style={styles.rotuloSaldo}>Saldo disponível</span>
          <span style={styles.valorSaldo}>
            {carregando ? '...' : `R$ ${Number(saldo || 0).toFixed(2)}`}
          </span>
          <div style={styles.botoes}>
            <button style={styles.botaoPrimario} onClick={() => abrirModal('depositar')}>
              Adicionar dinheiro
            </button>
            <button style={styles.botaoSecundario} onClick={() => abrirModal('sacar')}>
              Sacar
            </button>
          </div>
        </div>

        {souPrestador && !carregando && (
          <>
            <h2 style={styles.subtitulo}>Seu desempenho</h2>
            <div style={styles.cardGrafico}>
              <GraficoEntradaSaida dados={porMes} />
            </div>

            <h2 style={styles.subtitulo}>Metas de serviço</h2>
            <SecaoMetas />
          </>
        )}

        <h2 style={styles.subtitulo}>Extrato</h2>

        {carregando ? (
          <p style={styles.info}>Carregando...</p>
        ) : extrato.length === 0 ? (
          <p style={styles.info}>Nenhuma movimentação ainda.</p>
        ) : (
          <>
            {extrato.map((item) => (
              <div key={item.id} style={styles.itemExtrato}>
                <div>
                  <div style={styles.itemTipo}>{ROTULOS_TIPO[item.tipo] || item.tipo}</div>
                  <div style={styles.itemData}>
                    {new Date(item.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {item.status === 'pendente' && ' · pendente'}
                  </div>
                </div>
                <div
                  style={{
                    ...styles.itemValor,
                    color: Number(item.valor) >= 0 ? 'var(--konectaja-verde)' : 'var(--konectaja-text-forte)',
                  }}
                >
                  {formatarValor(item.valor)}
                </div>
              </div>
            ))}
            {temMaisExtrato && (
              <button
                style={styles.botaoCarregarMais}
                onClick={carregarMaisExtrato}
                disabled={carregandoMaisExtrato}
              >
                {carregandoMaisExtrato ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </>
        )}
      </main>

      {modal && (
        <div style={styles.modalFundo} onClick={() => !processando && fecharModal()}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {modal === 'depositar' && !linkPagamento && (
              <form onSubmit={aoConfirmarDeposito}>
                <h2 style={styles.modalTitulo}>Adicionar dinheiro</h2>
                <p style={styles.modalTexto}>
                  Gera uma cobrança Pix pra você pagar — o valor entra na carteira assim que o
                  pagamento for confirmado.
                </p>
                <input
                  style={styles.modalInput}
                  placeholder="Valor (R$)"
                  value={valorDigitado}
                  onChange={(e) => setValorDigitado(e.target.value)}
                  autoFocus
                />
                {erroModal && <p style={styles.erroModal}>{erroModal}</p>}
                <div style={styles.modalBotoes}>
                  <button type="button" style={styles.botaoSecundario} onClick={fecharModal}>
                    Cancelar
                  </button>
                  <button type="submit" style={styles.botaoPrimario} disabled={processando}>
                    {processando ? 'Gerando...' : 'Gerar cobrança Pix'}
                  </button>
                </div>
              </form>
            )}

            {modal === 'depositar' && linkPagamento && (
              <>
                <h2 style={styles.modalTitulo}>Cobrança gerada</h2>
                <p style={styles.modalTexto}>
                  Toque no botão abaixo pra abrir a página de pagamento (Pix, cartão ou boleto).
                  Assim que o pagamento for confirmado, o valor aparece na sua carteira.
                </p>
                <a href={linkPagamento} target="_blank" rel="noopener noreferrer" style={styles.linkPagar}>
                  Pagar agora
                </a>
                <div style={styles.modalBotoes}>
                  <button
                    type="button"
                    style={styles.botaoSecundario}
                    onClick={() => {
                      fecharModal();
                      carregar();
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}

            {modal === 'sacar' && (
              <form onSubmit={aoConfirmarSaque}>
                <h2 style={styles.modalTitulo}>Sacar</h2>
                <p style={styles.modalTexto}>O valor vai direto pra sua chave Pix.</p>
                <input
                  style={styles.modalInput}
                  placeholder="Valor (R$)"
                  value={valorDigitado}
                  onChange={(e) => setValorDigitado(e.target.value)}
                  autoFocus
                />
                <select
                  style={styles.modalInput}
                  value={tipoChavePix}
                  onChange={(e) => setTipoChavePix(e.target.value)}
                >
                  {TIPOS_CHAVE_PIX.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.rotulo}
                    </option>
                  ))}
                </select>
                <input
                  style={styles.modalInput}
                  placeholder="Sua chave Pix"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                />
                {erroModal && <p style={styles.erroModal}>{erroModal}</p>}
                <div style={styles.modalBotoes}>
                  <button type="button" style={styles.botaoSecundario} onClick={fecharModal}>
                    Cancelar
                  </button>
                  <button type="submit" style={styles.botaoPrimario} disabled={processando}>
                    {processando ? 'Processando...' : 'Sacar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function rotuloMes(periodo) {
  const [ano, mes] = periodo.split('-').map(Number);
  const texto = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'short' });
  return texto.replace('.', '');
}

// Barras agrupadas entrada/saída por mês — entrada em verde (cor já
// usada pra "positivo" no resto do app), saída num neutro escuro (não
// vermelho: sacar não é um problema, é o prestador usando o dinheiro
// dele).
function GraficoEntradaSaida({ dados }) {
  if (!dados || dados.length === 0) {
    return <p style={styles.info}>Ainda sem movimentações de serviço pra mostrar aqui.</p>;
  }

  const maximo = Math.max(1, ...dados.flatMap((d) => [Number(d.entrada), Number(d.saida)]));
  const largura = 320;
  const altura = 140;
  const alturaBarras = 96;
  const baseY = alturaBarras + 8;
  const larguraGrupo = largura / dados.length;
  const larguraBarra = Math.min(14, larguraGrupo / 3.2);

  return (
    <div>
      <div style={styles.legenda}>
        <span style={styles.legendaItem}>
          <span style={{ ...styles.legendaCor, background: 'var(--konectaja-verde)' }} /> Entrada
        </span>
        <span style={styles.legendaItem}>
          <span style={{ ...styles.legendaCor, background: 'var(--konectaja-text-forte)' }} /> Saída
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="Entrada e saída por mês">
        {dados.map((item, i) => {
          const cx = i * larguraGrupo + larguraGrupo / 2;
          const hEntrada = (Number(item.entrada) / maximo) * alturaBarras;
          const hSaida = (Number(item.saida) / maximo) * alturaBarras;
          return (
            <g key={item.periodo}>
              <rect
                x={cx - larguraBarra - 2}
                y={baseY - hEntrada}
                width={larguraBarra}
                height={Math.max(hEntrada, 1)}
                rx={3}
                fill="var(--konectaja-verde)"
              />
              <rect
                x={cx + 2}
                y={baseY - hSaida}
                width={larguraBarra}
                height={Math.max(hSaida, 1)}
                rx={3}
                fill="var(--konectaja-text-forte)"
              />
              <text x={cx} y={altura - 4} textAnchor="middle" fontSize="9" fill="var(--konectaja-muted)">
                {rotuloMes(item.periodo)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const ROTULOS_META = { semana: 'Por semana', mes: 'Por mês' };

function SecaoMetas() {
  const [metas, setMetas] = useState(null);
  const [editando, setEditando] = useState(null); // 'semana' | 'mes' | null
  const [valorMeta, setValorMeta] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroMeta, setErroMeta] = useState(null);

  useEffect(() => {
    carregarMetas();
  }, []);

  function carregarMetas() {
    minhasMetas()
      .then(setMetas)
      .catch(() => setMetas([]));
  }

  function abrirEdicao(tipo, quantidadeAtual) {
    setEditando(tipo);
    setValorMeta(quantidadeAtual ? String(quantidadeAtual) : '');
    setErroMeta(null);
  }

  async function salvar(tipo) {
    const quantidade = Number(valorMeta);
    if (!quantidade || quantidade <= 0) return setErroMeta('Informe um número válido');

    setSalvando(true);
    setErroMeta(null);
    try {
      await definirMeta({ tipo, quantidade });
      setEditando(null);
      carregarMetas();
    } catch (erro) {
      setErroMeta(mensagemErro(erro, 'Não foi possível salvar a meta.'));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(tipo) {
    await removerMeta(tipo).catch(() => {});
    carregarMetas();
  }

  if (metas === null) return <p style={styles.info}>Carregando...</p>;

  return (
    <div style={styles.listaMetas}>
      {['semana', 'mes'].map((tipo) => {
        const meta = metas.find((m) => m.tipo === tipo);
        const progresso = meta ? Math.min(100, Math.round((meta.progresso / meta.quantidade) * 100)) : 0;

        return (
          <div key={tipo} style={styles.cardMeta}>
            <div style={styles.cardMetaTopo}>
              <span style={styles.cardMetaTitulo}>{ROTULOS_META[tipo]}</span>
              {meta && editando !== tipo && (
                <div style={styles.cardMetaAcoes}>
                  <button style={styles.linkAcao} onClick={() => abrirEdicao(tipo, meta.quantidade)}>
                    Editar
                  </button>
                  <button style={styles.linkAcao} onClick={() => remover(tipo)}>
                    Remover
                  </button>
                </div>
              )}
            </div>

            {editando === tipo ? (
              <div style={styles.formMeta}>
                <input
                  style={styles.inputMeta}
                  placeholder="Quantos serviços?"
                  value={valorMeta}
                  onChange={(e) => setValorMeta(e.target.value)}
                  inputMode="numeric"
                  autoFocus
                />
                <button style={styles.botaoSalvarMeta} onClick={() => salvar(tipo)} disabled={salvando}>
                  {salvando ? '...' : 'Salvar'}
                </button>
                <button style={styles.linkAcao} onClick={() => setEditando(null)}>
                  Cancelar
                </button>
              </div>
            ) : meta ? (
              <>
                <p style={styles.cardMetaTexto}>
                  {meta.progresso} de {meta.quantidade} serviços concluídos
                </p>
                <div style={styles.barraProgresso}>
                  <div style={{ ...styles.barraProgressoPreenchida, width: `${progresso}%` }} />
                </div>
              </>
            ) : (
              <button style={styles.linkAcaoDestaque} onClick={() => abrirEdicao(tipo, null)}>
                + Definir meta
              </button>
            )}
            {editando === tipo && erroMeta && <p style={styles.erroModal}>{erroMeta}</p>}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '24px 24px 104px' },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 22, margin: '0 0 16px' },
  erro: { color: 'var(--konectaja-red)', fontSize: 13 },
  cardSaldo: {
    background: 'linear-gradient(135deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    borderRadius: 20,
    padding: 24,
    color: '#fff',
    boxShadow: 'var(--konectaja-shadow-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  rotuloSaldo: { fontSize: 13, opacity: 0.85, fontWeight: 600 },
  valorSaldo: { fontSize: 34, fontWeight: 800, marginTop: 2 },
  botoes: { display: 'flex', gap: 10, marginTop: 18 },
  botaoPrimario: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: 'none',
    background: '#fff',
    color: 'var(--konectaja-laranja-escuro)',
    fontWeight: 700,
    fontSize: 13.5,
  },
  botaoSecundario: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: '1.5px solid rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13.5,
  },
  subtitulo: { color: 'var(--konectaja-text-forte)', fontSize: 16, margin: '28px 0 12px' },
  info: { color: 'var(--konectaja-muted)', textAlign: 'center', marginTop: 24, fontSize: 13 },
  itemExtrato: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: '12px 16px',
    marginBottom: 8,
  },
  itemTipo: { color: 'var(--konectaja-text-forte)', fontWeight: 700, fontSize: 13.5 },
  itemData: { color: 'var(--konectaja-muted)', fontSize: 11.5, marginTop: 2, textTransform: 'capitalize' },
  itemValor: { fontWeight: 800, fontSize: 14 },
  botaoCarregarMais: {
    display: 'block',
    width: '100%',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: '12px 16px',
    marginTop: 8,
    color: 'var(--konectaja-text-forte)',
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
  },
  modalFundo: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 25, 23, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modalCard: {
    width: 380,
    maxWidth: '100%',
    background: 'var(--konectaja-bg2)',
    borderRadius: 18,
    padding: 24,
    boxShadow: 'var(--konectaja-shadow-lg)',
  },
  modalTitulo: { color: 'var(--konectaja-text-forte)', fontSize: 18, margin: '0 0 8px' },
  modalTexto: { color: 'var(--konectaja-muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' },
  modalInput: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 12px',
    fontSize: 14,
    marginBottom: 10,
    boxSizing: 'border-box',
  },
  erroModal: { color: 'var(--konectaja-red)', fontSize: 13, margin: '0 0 10px' },
  modalBotoes: { display: 'flex', gap: 8, marginTop: 4 },
  cardGrafico: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 16,
    padding: '16px 18px',
  },
  legenda: { display: 'flex', gap: 16, marginBottom: 8 },
  legendaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--konectaja-muted)',
  },
  legendaCor: { width: 10, height: 10, borderRadius: 3, display: 'inline-block' },
  listaMetas: { display: 'flex', flexDirection: 'column', gap: 10 },
  cardMeta: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: '14px 16px',
  },
  cardMetaTopo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardMetaTitulo: { color: 'var(--konectaja-text-forte)', fontWeight: 700, fontSize: 13.5 },
  cardMetaAcoes: { display: 'flex', gap: 12 },
  cardMetaTexto: { color: 'var(--konectaja-muted)', fontSize: 12.5, margin: '8px 0 6px' },
  linkAcao: {
    border: 'none',
    background: 'none',
    color: 'var(--konectaja-laranja-escuro)',
    fontWeight: 600,
    fontSize: 12.5,
    padding: 0,
    cursor: 'pointer',
  },
  linkAcaoDestaque: {
    border: 'none',
    background: 'none',
    color: 'var(--konectaja-laranja-escuro)',
    fontWeight: 700,
    fontSize: 13,
    padding: '8px 0 0',
    cursor: 'pointer',
  },
  formMeta: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  inputMeta: {
    flex: 1,
    minWidth: 100,
    height: 38,
    borderRadius: 8,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 10px',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  botaoSalvarMeta: {
    height: 38,
    padding: '0 14px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--konectaja-laranja)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12.5,
  },
  barraProgresso: {
    height: 8,
    borderRadius: 4,
    background: 'var(--konectaja-bg3)',
    overflow: 'hidden',
  },
  barraProgressoPreenchida: {
    height: '100%',
    borderRadius: 4,
    background: 'var(--konectaja-verde)',
  },
  linkPagar: {
    display: 'block',
    textAlign: 'center',
    height: 46,
    lineHeight: '46px',
    borderRadius: 10,
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    textDecoration: 'none',
  },
};
