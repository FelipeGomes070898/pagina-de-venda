import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { CATEGORIAS } from '../../constants/categorias';
import { meuPerfil } from '../../services/authService';
import { listarPedidosAbertos, responderPedidoAberto } from '../../services/marketplaceService';

const ROTULO_STATUS = {
  ativo: { texto: 'Conta ativa', cor: 'var(--konectaja-verde)' },
  inadimplente: { texto: 'Pagamento pendente', cor: 'var(--konectaja-laranja)' },
  bloqueado: { texto: 'Conta bloqueada', cor: 'var(--konectaja-red)' },
};

// Home do prestador: diferente da do cliente (que navega o marketplace de
// prestadores) — aqui o que importa é ver o próprio desempenho e os
// pedidos em aberto que ele pode responder. Antes disso não existia, o
// prestador caía na mesma tela do cliente, inclusive via a si mesmo na
// lista com um botão "Contato" sem sentido nenhum.
export function PrestadorHome() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const cidadeUsuario = usuario?.cidade;

  const [perfil, setPerfil] = useState(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [respondendoId, setRespondendoId] = useState(null);
  const [erro, setErro] = useState(null);

  async function carregar() {
    setErro(null);
    try {
      const [listaPedidos] = await Promise.all([
        listarPedidosAbertos({ cidade: cidadeUsuario || undefined, segmento: categoriaAtiva || undefined }),
        meuPerfil().then(setPerfil),
      ]);
      setPedidos(listaPedidos);
    } catch {
      setErro('Não foi possível carregar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaAtiva, cidadeUsuario]);

  async function aoResponder(pedido) {
    setRespondendoId(pedido.id);
    setErro(null);
    try {
      await responderPedidoAberto(pedido.id);
      navigate(`/chat/${pedido.id}`, { state: { prestadorNome: '' } });
    } catch {
      setErro('Esse pedido já não está mais disponível — outro prestador deve ter respondido primeiro.');
      setPedidos((atual) => atual.filter((p) => p.id !== pedido.id));
    } finally {
      setRespondendoId(null);
    }
  }

  const status = perfil?.status ? ROTULO_STATUS[perfil.status] : null;

  return (
    <div style={styles.pagina}>
      <header style={styles.header}>
        <div style={styles.marca}>KONECTA JÁ</div>
        <div style={styles.headerDireita}>
          <button style={styles.usuarioNome} onClick={() => navigate('/perfil')}>
            {usuario?.nome}
          </button>
          <button style={styles.sair} onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main style={styles.container}>
        <h1 style={styles.titulo}>Olá, {perfil?.nome?.split(' ')[0] || ''}</h1>

        <div style={styles.statsCard}>
          <div style={styles.statItem}>
            <div style={styles.statValor}>⭐ {Number(perfil?.avaliacao ?? 5).toFixed(1)}</div>
            <div style={styles.statLabel}>{perfil?.total_avaliacoes ?? 0} avaliações</div>
          </div>
          <div style={styles.statDivisor} />
          <div style={styles.statItem}>
            <div style={styles.statValor}>{perfil?.total_servicos ?? 0}</div>
            <div style={styles.statLabel}>serviços feitos</div>
          </div>
        </div>

        {status && (
          <div style={{ ...styles.statusChip, borderColor: status.cor }}>
            <span style={{ ...styles.statusBolinha, background: status.cor }} />
            <span style={{ color: status.cor, fontWeight: 700, fontSize: 12 }}>{status.texto}</span>
          </div>
        )}

        <h2 style={styles.subtitulo}>Pedidos em aberto perto de você</h2>

        <div style={styles.categorias}>
          <button
            style={{ ...styles.chip, ...(categoriaAtiva === null ? styles.chipAtiva : {}) }}
            onClick={() => setCategoriaAtiva(null)}
          >
            Todas
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              style={{ ...styles.chip, ...(categoriaAtiva === cat ? styles.chipAtiva : {}) }}
              onClick={() => setCategoriaAtiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {erro && <p style={styles.erro}>{erro}</p>}

        {carregando ? (
          <p style={styles.info}>Carregando...</p>
        ) : pedidos.length === 0 ? (
          <p style={styles.info}>Nenhum pedido em aberto na sua cidade ainda.</p>
        ) : (
          pedidos.map((pedido) => (
            <div key={pedido.id} style={styles.pedidoCard}>
              <div>{pedido.descricao}</div>
              <div style={styles.pedidoRodape}>
                {pedido.valor != null ? (
                  <span style={styles.pedidoValor}>R$ {Number(pedido.valor).toFixed(2)}</span>
                ) : (
                  <span style={styles.pedidoSemValor}>Sem valor sugerido</span>
                )}
                <button
                  style={styles.botaoResponder}
                  onClick={() => aoResponder(pedido)}
                  disabled={respondendoId === pedido.id}
                >
                  {respondendoId === pedido.id ? 'Respondendo...' : 'Responder'}
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid var(--konectaja-border)',
  },
  marca: { fontSize: 20, fontWeight: 900, color: 'var(--konectaja-laranja)', letterSpacing: 1 },
  headerDireita: { display: 'flex', alignItems: 'center', gap: 12 },
  usuarioNome: {
    color: 'var(--konectaja-text)',
    fontSize: 13,
    fontWeight: 600,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  sair: {
    background: 'transparent',
    border: '1px solid var(--konectaja-border)',
    color: 'var(--konectaja-muted)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
  },
  container: { maxWidth: 640, margin: '0 auto', padding: 24 },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 22, margin: '0 0 16px' },
  statsCard: {
    display: 'flex',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 16,
    padding: 20,
  },
  statItem: { flex: 1, textAlign: 'center' },
  statDivisor: { width: 1, background: 'var(--konectaja-border)' },
  statValor: { fontSize: 22, fontWeight: 800, color: 'var(--konectaja-text-forte)' },
  statLabel: { fontSize: 12, color: 'var(--konectaja-muted)', marginTop: 4 },
  statusChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid',
    borderRadius: 999,
    padding: '6px 12px',
    marginTop: 12,
  },
  statusBolinha: { width: 8, height: 8, borderRadius: 4 },
  subtitulo: { color: 'var(--konectaja-text-forte)', fontSize: 16, marginTop: 24, marginBottom: 12 },
  categorias: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text)',
    fontSize: 12,
  },
  chipAtiva: { background: 'var(--konectaja-laranja)', borderColor: 'var(--konectaja-laranja)', color: '#fff' },
  erro: { color: 'var(--konectaja-red)', fontSize: 13 },
  info: { color: 'var(--konectaja-muted)', textAlign: 'center', marginTop: 32, fontSize: 13 },
  pedidoCard: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    color: 'var(--konectaja-text)',
  },
  pedidoRodape: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  pedidoValor: { color: 'var(--konectaja-verde)', fontWeight: 700 },
  pedidoSemValor: { color: 'var(--konectaja-muted)', fontSize: 12, fontStyle: 'italic' },
  botaoResponder: {
    background: 'var(--konectaja-laranja)',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
  },
};
