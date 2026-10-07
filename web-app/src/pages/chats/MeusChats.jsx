import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../../components/BottomNav';
import { listarMinhasConversas } from '../../services/marketplaceService';

const ROTULO_STATUS = {
  pendente: 'Aguardando resposta',
  andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  agendado: 'Agendado',
};

// Não existia nenhum jeito de rever uma conversa já iniciada a não ser
// lembrar a URL de cor — só dava pra chegar no chat na hora de contatar
// um prestador ou responder um pedido. Mesma lista que o mobile tem na
// aba "Chats" (GET /api/pedidos/meus).
export function MeusChats() {
  const navigate = useNavigate();

  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    listarMinhasConversas()
      .then(setConversas)
      .catch(() => setErro('Não foi possível carregar suas conversas.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div style={styles.pagina}>
      <BottomNav />

      <main style={styles.container}>
        <h1 style={styles.titulo}>Chats</h1>

        {erro && <p style={styles.erro}>{erro}</p>}

        {carregando ? (
          <p style={styles.info}>Carregando...</p>
        ) : conversas.length === 0 ? (
          <p style={styles.info}>
            Você ainda não tem conversas. Entre em contato com um prestador no Marketplace.
          </p>
        ) : (
          conversas.map((item) => (
            <button
              key={item.id}
              style={styles.card}
              onClick={() =>
                navigate(`/chat/${item.id}`, {
                  state: { prestadorNome: item.contraparte_nome || 'Conversa' },
                })
              }
            >
              <div style={styles.avatar}>
                {(item.contraparte_nome || '?').charAt(0).toUpperCase()}
              </div>
              <div style={styles.info2}>
                <div style={styles.nome}>{item.contraparte_nome || 'Aguardando prestador'}</div>
                <div style={styles.descricao}>{item.descricao || 'Sem descrição'}</div>
              </div>
              <div style={styles.direita}>
                {item.valor != null && (
                  <div style={styles.valor}>R$ {Number(item.valor).toFixed(2)}</div>
                )}
                <div style={styles.status}>{ROTULO_STATUS[item.status] || item.status}</div>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 640, margin: '0 auto', padding: '24px 24px 104px' },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 22, margin: '0 0 16px' },
  erro: { color: 'var(--konectaja-red)', fontSize: 13 },
  info: { color: 'var(--konectaja-muted)', textAlign: 'center', marginTop: 32, fontSize: 13 },
  card: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: 13,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  avatar: {
    flexShrink: 0,
    width: 48,
    height: 48,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #F6AD3C, var(--konectaja-laranja-escuro))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 17,
    boxShadow: '0 4px 10px rgba(180, 83, 9, 0.35)',
    border: '2.5px solid #fff',
  },
  info2: { flex: 1, minWidth: 0 },
  nome: { color: 'var(--konectaja-text-forte)', fontWeight: 700, fontSize: 14 },
  descricao: {
    color: 'var(--konectaja-muted)',
    fontSize: 12,
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  direita: { flexShrink: 0, textAlign: 'right' },
  valor: { color: 'var(--konectaja-laranja-escuro)', fontWeight: 800, fontSize: 14 },
  status: { color: 'var(--konectaja-muted)', fontSize: 11, marginTop: 2 },
};
