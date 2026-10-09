import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import {
  atualizarStatusPedido,
  confirmarPagamento,
  enviarEndereco,
  enviarMensagem,
  enviarProposta,
  listarConversa,
  pagarComSaldo,
  responderProposta,
} from '../../services/chatService';
import { mensagemErro } from '../../utils/erro';

const INTERVALO_ATUALIZACAO_MS = 5000;

const IconePin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.3-7-11.5A7 7 0 0 1 19 9.5C19 14.7 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.3" />
  </svg>
);

const IconeCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5L20 6" />
  </svg>
);

function montarLinhaDoTempo(conversa) {
  const itens = [
    ...conversa.mensagens.map((m) => ({ tipoItem: 'mensagem', id: `m-${m.id}`, criadoEm: m.criado_em, dado: m })),
    ...conversa.propostas.map((p) => ({ tipoItem: 'proposta', id: `p-${p.id}`, criadoEm: p.criado_em, dado: p })),
  ];
  return itens.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
}

function rotuloStatus(status) {
  const rotulos = {
    pendente: 'Negociando',
    andamento: 'Fechado — em andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };
  return rotulos[status] || status;
}

export function Chat() {
  const { pedidoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const prestadorNome = location.state?.prestadorNome || 'Prestador';
  const meuTipo = useAuthStore((s) => s.usuario?.tipo);

  const [conversa, setConversa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [mostrarFormProposta, setMostrarFormProposta] = useState(false);
  const [valorProposta, setValorProposta] = useState('');

  const [endereco, setEndereco] = useState({ texto: '', lat: null, lng: null });
  const [enviandoEndereco, setEnviandoEndereco] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const [pagandoComSaldo, setPagandoComSaldo] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const listaRef = useRef(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await listarConversa(pedidoId);
      setConversa(dados);
      // Limpa qualquer erro de uma ação anterior (enviar mensagem,
      // confirmar pagamento etc.) assim que uma consulta der certo —
      // sem isso, um erro antigo ficava preso na tela pra sempre, até
      // mesmo depois de tudo voltar a funcionar.
      setErro(null);
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível carregar a conversa.'));
    } finally {
      setCarregando(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [carregar]);

  // Só rola pro fim quando chega mensagem/proposta NOVA de verdade —
  // antes rolava a cada 5s (a cada poll), mesmo sem nada novo, o que
  // puxava a pessoa de volta pro fim toda vez que ela tentava subir
  // pra reler uma mensagem antiga.
  const quantidadeAnteriorRef = useRef(0);
  useEffect(() => {
    if (!conversa) return;
    const quantidade = conversa.mensagens.length + conversa.propostas.length;
    if (quantidade > quantidadeAnteriorRef.current) {
      listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
    }
    quantidadeAnteriorRef.current = quantidade;
  }, [conversa]);

  async function aoEnviarMensagem(e) {
    e.preventDefault();
    // Apertar Enter dentro do campo envia o form direto, sem passar
    // pelo botão (que fica `disabled` enquanto `enviando` é true) — sem
    // essa checagem, duas teclas Enter bem rápidas mandavam a mesma
    // mensagem duas vezes.
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await enviarMensagem(pedidoId, texto.trim());
      setTexto('');
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível enviar a mensagem.'));
    } finally {
      setEnviando(false);
    }
  }

  async function aoEnviarProposta() {
    const valor = Number(valorProposta.replace(',', '.'));
    if (!valor || valor <= 0) return;
    setEnviando(true);
    try {
      await enviarProposta(pedidoId, { valor });
      setValorProposta('');
      setMostrarFormProposta(false);
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível enviar a proposta.'));
    } finally {
      setEnviando(false);
    }
  }

  async function aoResponderProposta(proposta, acao) {
    try {
      await responderProposta(pedidoId, proposta.id, acao);
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível responder a proposta.'));
    }
  }

  async function aoEnviarEndereco() {
    if (!endereco.texto.trim()) return;
    setEnviandoEndereco(true);
    try {
      await enviarEndereco(pedidoId, { endereco: endereco.texto.trim(), lat: endereco.lat, lng: endereco.lng });
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível enviar o endereço.'));
    } finally {
      setEnviandoEndereco(false);
    }
  }

  async function aoMarcarConcluido() {
    setFinalizando(true);
    try {
      await atualizarStatusPedido(pedidoId, 'concluido');
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível marcar o serviço como concluído.'));
    } finally {
      setFinalizando(false);
    }
  }

  async function aoConfirmarPagamento(quando) {
    setConfirmandoPagamento(true);
    try {
      await confirmarPagamento(pedidoId, { quando, forma: formaPagamento });
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível confirmar o pagamento.'));
    } finally {
      setConfirmandoPagamento(false);
    }
  }

  async function aoPagarComSaldo() {
    setPagandoComSaldo(true);
    try {
      await pagarComSaldo(pedidoId);
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível pagar com a carteira.'));
    } finally {
      setPagandoComSaldo(false);
    }
  }

  async function aoCancelarPedido() {
    if (!window.confirm('Tem certeza que deseja cancelar este pedido? Essa ação não pode ser desfeita.')) {
      return;
    }
    setCancelando(true);
    try {
      await atualizarStatusPedido(pedidoId, 'cancelado');
      await carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível cancelar o pedido.'));
    } finally {
      setCancelando(false);
    }
  }

  if (carregando || !conversa) {
    return <div style={styles.centro}>Carregando...</div>;
  }

  const pedidoFechado = conversa.pedido.status === 'andamento';
  const pedidoConcluido = conversa.pedido.status === 'concluido';
  const pedidoCancelado = conversa.pedido.status === 'cancelado';
  const podeCancelar = !pedidoConcluido && !pedidoCancelado;
  const podeReceberEndereco = meuTipo === 'cliente' && pedidoFechado && !conversa.pedido.endereco;

  return (
    <div style={styles.pagina}>
      <div style={styles.header}>
        <button style={styles.voltar} onClick={() => navigate('/')}>
          ← Marketplace
        </button>
        <div>
          <div style={styles.headerTitulo}>{prestadorNome}</div>
          <div style={styles.headerStatus}>{rotuloStatus(conversa.pedido.status)}</div>
        </div>
      </div>

      <div style={styles.lista} ref={listaRef}>
        {montarLinhaDoTempo(conversa).map((item) =>
          item.tipoItem === 'mensagem' ? (
            <BalaoMensagem key={item.id} mensagem={item.dado} meuTipo={meuTipo} />
          ) : (
            <CartaoProposta
              key={item.id}
              proposta={item.dado}
              meuTipo={meuTipo}
              podeResponder={!pedidoConcluido && !pedidoCancelado}
              onResponder={(acao) => aoResponderProposta(item.dado, acao)}
            />
          ),
        )}
      </div>

      {erro && <p style={styles.erro}>{erro}</p>}

      {podeReceberEndereco && (
        <div style={styles.enderecoWrapper}>
          <p style={styles.enderecoRotulo}>Pedido fechado! Envie o endereço:</p>
          <div style={styles.linhaEnvio}>
            <AddressAutocompleteInput
              value={endereco.texto}
              onChange={(texto) => setEndereco((s) => ({ ...s, texto }))}
              onSelecionar={(dados) => setEndereco({ texto: dados.enderecoCompleto, lat: dados.lat, lng: dados.lng })}
              placeholder="Rua, número, bairro..."
              style={styles.inputFlex}
            />
            <button style={styles.botaoEnviar} onClick={aoEnviarEndereco} disabled={enviandoEndereco}>
              {enviandoEndereco ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}

      {conversa.pedido.endereco && (
        <p style={styles.enderecoConfirmado}>
          <IconePin /> Endereço enviado: {conversa.pedido.endereco}
        </p>
      )}

      {meuTipo === 'cliente' && (pedidoFechado || pedidoConcluido) && (
        <div style={styles.pagamentoWrapper}>
          {conversa.pedido.pagamento_confirmado_em ? (
            <p style={styles.enderecoConfirmado}>
              <IconeCheck />{' '}
              {conversa.pedido.pago_via_carteira
                ? 'Pago com a Carteira do Konecta Já'
                : `Pagamento confirmado por você (${
                    conversa.pedido.pagamento_forma === 'app' ? 'pelo app' : 'Pix direto pro prestador'
                  }, ${conversa.pedido.pagamento_quando === 'antecipado' ? 'antes do serviço' : 'depois do serviço'})`}
            </p>
          ) : !formaPagamento ? (
            <>
              <p style={styles.enderecoRotulo}>Como você vai pagar o prestador?</p>
              <div style={styles.linhaEnvio}>
                <button style={styles.botaoPagamento} onClick={aoPagarComSaldo} disabled={pagandoComSaldo}>
                  {pagandoComSaldo ? 'Pagando...' : 'Pagar com a Carteira'}
                </button>
                <button style={styles.botaoPagamento} onClick={() => setFormaPagamento('pix_direto')}>
                  Pix direto pro prestador
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={styles.enderecoRotulo}>Pagou antes do serviço ou depois?</p>
              <div style={styles.linhaEnvio}>
                <button
                  style={styles.botaoPagamento}
                  onClick={() => aoConfirmarPagamento('antecipado')}
                  disabled={confirmandoPagamento}
                >
                  Antes do serviço
                </button>
                <button
                  style={styles.botaoPagamento}
                  onClick={() => aoConfirmarPagamento('apos')}
                  disabled={confirmandoPagamento}
                >
                  Depois do serviço
                </button>
              </div>
              <button style={styles.botaoVoltarPagamento} onClick={() => setFormaPagamento(null)}>
                ← Voltar
              </button>
            </>
          )}
        </div>
      )}

      {pedidoFechado && (
        <button style={styles.botaoConcluir} onClick={aoMarcarConcluido} disabled={finalizando}>
          {finalizando ? 'Marcando...' : 'Marcar serviço como concluído'}
        </button>
      )}

      {pedidoConcluido && meuTipo === 'cliente' && (
        <button
          style={styles.botaoConcluir}
          onClick={() => navigate(`/avaliar/${pedidoId}`, { state: { prestadorNome } })}
        >
          ⭐ Avaliar prestador
        </button>
      )}
      {pedidoConcluido && meuTipo === 'prestador' && (
        <button
          style={styles.botaoConcluir}
          onClick={() => navigate(`/avaliar-cliente/${pedidoId}`, { state: { clienteNome: prestadorNome } })}
        >
          ⭐ Avaliar cliente
        </button>
      )}

      {pedidoCancelado && <p style={styles.pedidoCanceladoAviso}>Este pedido foi cancelado.</p>}

      {podeCancelar && (
        <button style={styles.botaoCancelar} onClick={aoCancelarPedido} disabled={cancelando}>
          {cancelando ? 'Cancelando...' : 'Cancelar pedido'}
        </button>
      )}

      {!pedidoConcluido && !pedidoCancelado && mostrarFormProposta && (
        <div style={styles.linhaEnvio}>
          <input
            style={styles.inputFlex}
            placeholder="Valor da proposta (R$)"
            value={valorProposta}
            onChange={(e) => setValorProposta(e.target.value)}
          />
          <button style={styles.botaoEnviar} onClick={aoEnviarProposta} disabled={enviando}>
            Propor
          </button>
        </div>
      )}

      {!pedidoCancelado && (
        <form style={styles.rodape} onSubmit={aoEnviarMensagem}>
          <button
            type="button"
            style={styles.botaoProposta}
            onClick={() => setMostrarFormProposta((v) => !v)}
          >
            R$
          </button>
          <input
            style={styles.inputMensagem}
            placeholder="Escreva uma mensagem..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button style={styles.botaoEnviar} type="submit" disabled={enviando}>
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

function formatarHora(isoString) {
  const data = new Date(isoString);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function BalaoMensagem({ mensagem, meuTipo }) {
  if (mensagem.remetente_tipo === 'sistema') {
    return <p style={styles.mensagemSistema}>{mensagem.conteudo}</p>;
  }
  const minhaMensagem = mensagem.remetente_tipo === meuTipo;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: minhaMensagem ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{ ...styles.balao, ...(minhaMensagem ? styles.balaoMeu : {}) }}>{mensagem.conteudo}</div>
      <span style={styles.horaMensagem}>{formatarHora(mensagem.criado_em)}</span>
    </div>
  );
}

function CartaoProposta({ proposta, meuTipo, podeResponder, onResponder }) {
  const minhaProposta = proposta.remetente_tipo === meuTipo;
  return (
    <div style={styles.cartaoProposta}>
      <div style={styles.cartaoPropostaValor}>R$ {Number(proposta.valor).toFixed(2)}</div>
      {proposta.status === 'pendente' && !minhaProposta && podeResponder && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={styles.botaoAceitar} onClick={() => onResponder('aceitar')}>
            Aceitar
          </button>
          <button style={styles.botaoRecusar} onClick={() => onResponder('recusar')}>
            Recusar
          </button>
        </div>
      )}
      {proposta.status === 'pendente' && (minhaProposta || !podeResponder) && (
        <p style={styles.cartaoPropostaStatus}>
          {podeResponder ? 'Aguardando resposta...' : 'Pedido já finalizado'}
        </p>
      )}
      {proposta.status !== 'pendente' && (
        <p style={styles.cartaoPropostaStatus}>{proposta.status === 'aceita' ? 'Aceita' : 'Recusada'}</p>
      )}
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  centro: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--konectaja-muted)' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderBottom: '1px solid var(--konectaja-border)',
    background: 'rgba(255,255,255,.85)',
    backdropFilter: 'blur(14px)',
  },
  voltar: { background: 'transparent', border: 'none', color: 'var(--konectaja-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  headerTitulo: { color: 'var(--konectaja-text-forte)', fontWeight: 800, fontSize: 15 },
  headerStatus: { color: 'var(--konectaja-muted)', fontSize: 12 },
  lista: { flex: 1, overflowY: 'auto', padding: 16, maxWidth: 640, margin: '0 auto', width: '100%' },
  mensagemSistema: { color: 'var(--konectaja-muted)', fontSize: 11, textAlign: 'center', margin: '8px 0' },
  balao: {
    maxWidth: '76%',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: '16px 16px 16px 4px',
    padding: '11px 15px',
    color: 'var(--konectaja-text-forte)',
    fontSize: 13,
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  balaoMeu: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    borderColor: 'transparent',
    color: '#fff',
    borderRadius: '16px 16px 4px 16px',
  },
  horaMensagem: { color: 'var(--konectaja-muted)', fontSize: 10.5, marginTop: 3 },
  cartaoProposta: {
    maxWidth: 220,
    margin: '0 auto 10px',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 16,
    padding: 14,
    textAlign: 'center',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  cartaoPropostaValor: { color: 'var(--konectaja-laranja-escuro)', fontWeight: 800, fontSize: 18 },
  cartaoPropostaStatus: { color: 'var(--konectaja-muted)', fontSize: 12, marginTop: 4 },
  botaoAceitar: { background: 'var(--konectaja-green)', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, color: '#0a0a0a' },
  botaoRecusar: { background: 'transparent', border: '1px solid var(--konectaja-red)', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, color: 'var(--konectaja-red)' },
  erro: { color: 'var(--konectaja-red)', fontSize: 12, textAlign: 'center' },
  enderecoWrapper: { maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 16px 8px' },
  enderecoRotulo: { color: 'var(--konectaja-green)', fontSize: 12, fontWeight: 600, marginBottom: 6 },
  pagamentoWrapper: { maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 16px 8px' },
  botaoPagamento: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--konectaja-laranja)',
    background: 'transparent',
    color: 'var(--konectaja-laranja)',
    fontWeight: 700,
    fontSize: 12,
  },
  botaoVoltarPagamento: {
    background: 'transparent',
    border: 'none',
    color: 'var(--konectaja-muted)',
    fontSize: 11,
    padding: '4px 0',
  },
  enderecoConfirmado: {
    color: 'var(--konectaja-verde)',
    fontSize: 12,
    textAlign: 'center',
    padding: '0 16px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  botaoConcluir: {
    maxWidth: 640,
    width: 'calc(100% - 32px)',
    margin: '0 auto 8px',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-green)',
    borderRadius: 12,
    padding: 10,
    color: 'var(--konectaja-green)',
    fontWeight: 700,
    fontSize: 13,
  },
  botaoCancelar: {
    maxWidth: 640,
    width: 'calc(100% - 32px)',
    margin: '0 auto 8px',
    background: 'transparent',
    border: '1px solid var(--konectaja-red)',
    borderRadius: 12,
    padding: 10,
    color: 'var(--konectaja-red)',
    fontWeight: 700,
    fontSize: 13,
  },
  pedidoCanceladoAviso: {
    color: 'var(--konectaja-red)',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
    padding: '0 16px 8px',
  },
  linhaEnvio: { display: 'flex', gap: 8, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 16px 8px' },
  inputFlex: { flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--konectaja-border)', background: 'var(--konectaja-bg2)', color: 'var(--konectaja-text-forte)', padding: '0 14px', fontSize: 14 },
  rodape: { display: 'flex', alignItems: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--konectaja-border)', maxWidth: 640, margin: '0 auto', width: '100%' },
  botaoProposta: { width: 44, height: 44, borderRadius: 12, background: 'var(--konectaja-bg2)', border: '1px solid var(--konectaja-laranja)', color: 'var(--konectaja-laranja)', fontWeight: 800, fontSize: 12 },
  inputMensagem: { flex: 1, height: 44, borderRadius: 14, border: '1px solid var(--konectaja-border)', background: 'var(--konectaja-bg3)', color: 'var(--konectaja-text-forte)', padding: '0 14px', fontSize: 14 },
  botaoEnviar: {
    height: 44,
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '0 16px',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
};
