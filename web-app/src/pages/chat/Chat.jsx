import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import {
  atualizarStatusPedido,
  enviarEndereco,
  enviarMensagem,
  enviarProposta,
  listarConversa,
  responderProposta,
} from '../../services/chatService';

const INTERVALO_ATUALIZACAO_MS = 5000;

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

  const listaRef = useRef(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await listarConversa(pedidoId);
      setConversa(dados);
    } catch {
      setErro('Não foi possível carregar a conversa.');
    } finally {
      setCarregando(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [carregar]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [conversa]);

  async function aoEnviarMensagem(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await enviarMensagem(pedidoId, texto.trim());
      setTexto('');
      await carregar();
    } catch {
      setErro('Não foi possível enviar a mensagem.');
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
    } catch {
      setErro('Não foi possível enviar a proposta.');
    } finally {
      setEnviando(false);
    }
  }

  async function aoResponderProposta(proposta, acao) {
    try {
      await responderProposta(pedidoId, proposta.id, acao);
      await carregar();
    } catch {
      setErro('Não foi possível responder a proposta.');
    }
  }

  async function aoEnviarEndereco() {
    if (!endereco.texto.trim()) return;
    setEnviandoEndereco(true);
    try {
      await enviarEndereco(pedidoId, { endereco: endereco.texto.trim(), lat: endereco.lat, lng: endereco.lng });
      await carregar();
    } catch {
      setErro('Não foi possível enviar o endereço.');
    } finally {
      setEnviandoEndereco(false);
    }
  }

  async function aoMarcarConcluido() {
    setFinalizando(true);
    try {
      await atualizarStatusPedido(pedidoId, 'concluido');
      await carregar();
    } catch {
      setErro('Não foi possível marcar o serviço como concluído.');
    } finally {
      setFinalizando(false);
    }
  }

  if (carregando || !conversa) {
    return <div style={styles.centro}>Carregando...</div>;
  }

  const pedidoFechado = conversa.pedido.status === 'andamento';
  const pedidoConcluido = conversa.pedido.status === 'concluido';
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
        <p style={styles.enderecoConfirmado}>📍 Endereço enviado: {conversa.pedido.endereco}</p>
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
      {pedidoConcluido && meuTipo === 'prestador' && <p style={styles.enderecoConfirmado}>Serviço concluído.</p>}

      {!pedidoConcluido && mostrarFormProposta && (
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
    </div>
  );
}

function BalaoMensagem({ mensagem, meuTipo }) {
  if (mensagem.remetente_tipo === 'sistema') {
    return <p style={styles.mensagemSistema}>{mensagem.conteudo}</p>;
  }
  const minhaMensagem = mensagem.remetente_tipo === meuTipo;
  return (
    <div style={{ display: 'flex', justifyContent: minhaMensagem ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{ ...styles.balao, ...(minhaMensagem ? styles.balaoMeu : {}) }}>{mensagem.conteudo}</div>
    </div>
  );
}

function CartaoProposta({ proposta, meuTipo, onResponder }) {
  const minhaProposta = proposta.remetente_tipo === meuTipo;
  return (
    <div style={styles.cartaoProposta}>
      <div style={styles.cartaoPropostaValor}>R$ {Number(proposta.valor).toFixed(2)}</div>
      {proposta.status === 'pendente' && !minhaProposta && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={styles.botaoAceitar} onClick={() => onResponder('aceitar')}>
            Aceitar
          </button>
          <button style={styles.botaoRecusar} onClick={() => onResponder('recusar')}>
            Recusar
          </button>
        </div>
      )}
      {proposta.status === 'pendente' && minhaProposta && (
        <p style={styles.cartaoPropostaStatus}>Aguardando resposta...</p>
      )}
      {proposta.status !== 'pendente' && (
        <p style={styles.cartaoPropostaStatus}>{proposta.status === 'aceita' ? 'Aceita ✅' : 'Recusada'}</p>
      )}
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  centro: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vexo-muted)' },
  header: { display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid var(--vexo-border)' },
  voltar: { background: 'transparent', border: 'none', color: 'var(--vexo-muted)', fontSize: 13, cursor: 'pointer' },
  headerTitulo: { color: '#fff', fontWeight: 700, fontSize: 15 },
  headerStatus: { color: 'var(--vexo-muted)', fontSize: 12 },
  lista: { flex: 1, overflowY: 'auto', padding: 16, maxWidth: 640, margin: '0 auto', width: '100%' },
  mensagemSistema: { color: 'var(--vexo-muted)', fontSize: 12, textAlign: 'center', margin: '8px 0' },
  balao: {
    maxWidth: '80%',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 12,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  balaoMeu: { background: 'var(--vexo-roxo)', borderColor: 'var(--vexo-roxo)' },
  cartaoProposta: {
    maxWidth: 220,
    margin: '0 auto 10px',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-laranja)',
    borderRadius: 12,
    padding: 14,
    textAlign: 'center',
  },
  cartaoPropostaValor: { color: 'var(--vexo-laranja)', fontWeight: 800, fontSize: 18 },
  cartaoPropostaStatus: { color: 'var(--vexo-muted)', fontSize: 12, marginTop: 4 },
  botaoAceitar: { background: 'var(--vexo-green)', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, color: '#0a0a0a' },
  botaoRecusar: { background: 'transparent', border: '1px solid var(--vexo-red)', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, color: 'var(--vexo-red)' },
  erro: { color: 'var(--vexo-red)', fontSize: 12, textAlign: 'center' },
  enderecoWrapper: { maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 16px 8px' },
  enderecoRotulo: { color: 'var(--vexo-green)', fontSize: 12, fontWeight: 600, marginBottom: 6 },
  enderecoConfirmado: { color: 'var(--vexo-muted)', fontSize: 12, textAlign: 'center', padding: '0 16px 8px' },
  botaoConcluir: {
    maxWidth: 640,
    width: 'calc(100% - 32px)',
    margin: '0 auto 8px',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-green)',
    borderRadius: 12,
    padding: 10,
    color: 'var(--vexo-green)',
    fontWeight: 700,
    fontSize: 13,
  },
  linhaEnvio: { display: 'flex', gap: 8, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 16px 8px' },
  inputFlex: { flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--vexo-border)', background: 'var(--vexo-bg2)', color: '#fff', padding: '0 14px', fontSize: 14 },
  rodape: { display: 'flex', alignItems: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--vexo-border)', maxWidth: 640, margin: '0 auto', width: '100%' },
  botaoProposta: { width: 44, height: 44, borderRadius: 12, background: 'var(--vexo-bg2)', border: '1px solid var(--vexo-laranja)', color: 'var(--vexo-laranja)', fontWeight: 800, fontSize: 12 },
  inputMensagem: { flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--vexo-border)', background: 'var(--vexo-bg2)', color: '#fff', padding: '0 14px', fontSize: 14 },
  botaoEnviar: { height: 44, borderRadius: 12, border: 'none', background: 'var(--vexo-roxo)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '0 16px' },
};
