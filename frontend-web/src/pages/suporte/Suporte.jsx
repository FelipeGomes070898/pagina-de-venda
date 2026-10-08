import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { estilosPagina as styles, formatarData } from '../../styles/paginaAdmin';

const ROTULOS_STATUS = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  resolvido: 'Resolvido',
};

// Fila de tickets abertos pelo app (barra de Ajuda do cliente/prestador)
// — antes disso não existia, o atendimento dependia só do chat do pedido.
export function Suporte() {
  const [tickets, setTickets] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [ticketAberto, setTicketAberto] = useState(null);
  const [resposta, setResposta] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get('/admin/tickets', { params: { status: filtroStatus || undefined } });
      setTickets(data);
    } catch {
      setErro('Não foi possível carregar os tickets');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  function abrirTicket(ticket) {
    setTicketAberto(ticket);
    setResposta(ticket.resposta || '');
  }

  async function aoResponder(status) {
    setSalvando(true);
    try {
      await api.patch(`/admin/tickets/${ticketAberto.id}`, { resposta, status });
      setTicketAberto(null);
      setResposta('');
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível responder o ticket');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Suporte</h1>
      <p style={styles.subtitulo}>
        Tickets abertos pelo cliente/prestador na barra de Ajuda do app.
      </p>

      <div style={styles.filtros}>
        <select style={styles.input} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_atendimento">Em atendimento</option>
          <option value="resolvido">Resolvido</option>
        </select>
      </div>

      {erro && <p style={styles.erro}>{erro}</p>}

      {carregando ? (
        <p style={styles.info}>Carregando...</p>
      ) : tickets.length === 0 ? (
        <p style={styles.info}>Nenhum ticket encontrado.</p>
      ) : (
        <table style={styles.tabela}>
          <thead>
            <tr>
              <th style={styles.th}>Quem pediu</th>
              <th style={styles.th}>Assunto</th>
              <th style={styles.th}>Aberto em</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>
                  {t.usuario_nome} <span style={{ color: 'var(--konectaja-muted)' }}>({t.usuario_tipo})</span>
                </td>
                <td style={styles.td}>{t.assunto}</td>
                <td style={styles.td}>{formatarData(t.criado_em)}</td>
                <td style={styles.td}>{ROTULOS_STATUS[t.status] || t.status}</td>
                <td style={styles.td}>
                  <button style={styles.linkBotao} onClick={() => abrirTicket(t)}>
                    {t.status === 'resolvido' ? 'Ver' : 'Responder'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {ticketAberto && (
        <div style={estiloModal.fundo} onClick={() => setTicketAberto(null)}>
          <div style={estiloModal.caixa} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...styles.titulo, fontSize: 16 }}>
              {ticketAberto.usuario_nome} — {ticketAberto.assunto}
            </h2>
            <p style={{ color: 'var(--konectaja-text)', fontSize: 13, marginTop: 8, whiteSpace: 'pre-wrap' }}>
              {ticketAberto.mensagem}
            </p>

            <textarea
              style={estiloModal.textarea}
              placeholder="Escreva a resposta..."
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={styles.botao} disabled={salvando} onClick={() => aoResponder('em_atendimento')}>
                Salvar e manter em atendimento
              </button>
              <button
                style={{ ...styles.botao, background: 'var(--konectaja-verde)' }}
                disabled={salvando}
                onClick={() => aoResponder('resolvido')}
              >
                Responder e marcar como resolvido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const estiloModal = {
  fundo: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28,25,23,.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  caixa: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 18,
    padding: 24,
    width: 480,
    maxWidth: 'calc(100vw - 32px)',
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: 12,
    fontSize: 13,
    marginTop: 12,
    resize: 'vertical',
  },
};
