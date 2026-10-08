import { useEffect, useState } from 'react';
import { BottomNav } from '../../components/BottomNav';
import { meuSaldo, meuExtrato, depositar, sacar } from '../../services/carteiraService';
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

export function Carteira() {
  const [saldo, setSaldo] = useState(null);
  const [extrato, setExtrato] = useState([]);
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
    Promise.all([meuSaldo(), meuExtrato()])
      .then(([saldoResp, extratoResp]) => {
        setSaldo(saldoResp.saldo);
        setExtrato(extratoResp);
      })
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar sua carteira.')))
      .finally(() => setCarregando(false));
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

        <h2 style={styles.subtitulo}>Extrato</h2>

        {carregando ? (
          <p style={styles.info}>Carregando...</p>
        ) : extrato.length === 0 ? (
          <p style={styles.info}>Nenhuma movimentação ainda.</p>
        ) : (
          extrato.map((item) => (
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
          ))
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
