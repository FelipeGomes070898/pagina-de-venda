import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ProfessionalCard } from '../../components/ProfessionalCard';
import { CATEGORIAS } from '../../constants/categorias';
import { obterLocalizacaoAtual } from '../../services/locationService';
import {
  contatarPrestador,
  listarPedidosAbertos,
  listarPrestadores,
  publicarPedidoAberto,
} from '../../services/marketplaceService';

export function Marketplace() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  const [aba, setAba] = useState('prestadores');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [coordenadas, setCoordenadas] = useState(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(true);

  const [prestadores, setPrestadores] = useState([]);
  const [pedidosAbertos, setPedidosAbertos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [contatandoId, setContatandoId] = useState(null);
  const [erro, setErro] = useState(null);

  const [mostrarFormPedido, setMostrarFormPedido] = useState(false);
  const [descricaoPedido, setDescricaoPedido] = useState('');
  const [valorPedido, setValorPedido] = useState('');
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    obterLocalizacaoAtual()
      .then(setCoordenadas)
      .finally(() => setBuscandoLocalizacao(false));
  }, []);

  async function carregar() {
    setErro(null);
    try {
      if (aba === 'prestadores') {
        const lista = await listarPrestadores({
          segmento: categoriaAtiva || undefined,
          lat: coordenadas?.lat,
          lng: coordenadas?.lng,
        });
        setPrestadores(lista);
      } else {
        const lista = await listarPedidosAbertos();
        setPedidosAbertos(lista);
      }
    } catch {
      setErro('Não foi possível carregar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (buscandoLocalizacao) return;
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, categoriaAtiva, buscandoLocalizacao]);

  async function aoContatar(prestador) {
    setContatandoId(prestador.id);
    try {
      const pedido = await contatarPrestador(prestador.id);
      navigate(`/pedido/${pedido.id}`, { state: { prestadorNome: prestador.nome } });
    } catch {
      setErro('Não foi possível entrar em contato agora.');
    } finally {
      setContatandoId(null);
    }
  }

  async function aoPublicarPedido() {
    if (!descricaoPedido.trim()) return;
    setPublicando(true);
    try {
      await publicarPedidoAberto({
        descricao: descricaoPedido.trim(),
        valorSugerido: valorPedido ? Number(valorPedido.replace(',', '.')) : undefined,
        segmento: categoriaAtiva || undefined,
      });
      setDescricaoPedido('');
      setValorPedido('');
      setMostrarFormPedido(false);
      carregar();
    } catch {
      setErro('Não foi possível publicar seu pedido.');
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div style={styles.pagina}>
      <header style={styles.header}>
        <div style={styles.marca}>
          Vex<span style={styles.marcaDestaque}>o</span>
        </div>
        <div style={styles.headerDireita}>
          <span style={styles.usuarioNome}>{usuario?.nome}</span>
          <button style={styles.sair} onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main style={styles.container}>
        <h1 style={styles.titulo}>Marketplace</h1>
        {aba === 'prestadores' && !buscandoLocalizacao && (
          <p style={styles.localizacaoInfo}>
            {coordenadas
              ? '📍 Ordenado pelos prestadores mais próximos de você'
              : 'Ative a localização do navegador para ver quem está mais perto'}
          </p>
        )}

        <div style={styles.abas}>
          <button
            style={{ ...styles.aba, ...(aba === 'prestadores' ? styles.abaAtiva : {}) }}
            onClick={() => setAba('prestadores')}
          >
            Prestadores
          </button>
          <button
            style={{ ...styles.aba, ...(aba === 'pedidos' ? styles.abaAtiva : {}) }}
            onClick={() => setAba('pedidos')}
          >
            Preciso de um serviço
          </button>
        </div>

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
        ) : aba === 'prestadores' ? (
          prestadores.length === 0 ? (
            <p style={styles.info}>Nenhum prestador encontrado nessa categoria ainda.</p>
          ) : (
            prestadores.map((p) => (
              <ProfessionalCard
                key={p.id}
                prestador={p}
                onContatar={() => aoContatar(p)}
                contatando={contatandoId === p.id}
              />
            ))
          )
        ) : (
          <>
            <div style={styles.publicarWrapper}>
              {!mostrarFormPedido ? (
                <button style={styles.botaoOutline} onClick={() => setMostrarFormPedido(true)}>
                  Publicar o que eu preciso
                </button>
              ) : (
                <div style={styles.formPedido}>
                  <textarea
                    style={styles.textarea}
                    placeholder="Descreva o serviço que você precisa"
                    value={descricaoPedido}
                    onChange={(e) => setDescricaoPedido(e.target.value)}
                  />
                  <input
                    style={styles.input}
                    placeholder="Valor que você quer oferecer (opcional)"
                    value={valorPedido}
                    onChange={(e) => setValorPedido(e.target.value)}
                  />
                  <button style={styles.botaoPrimario} onClick={aoPublicarPedido} disabled={publicando}>
                    {publicando ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              )}
            </div>
            {pedidosAbertos.length === 0 ? (
              <p style={styles.info}>Nenhum pedido em aberto no momento.</p>
            ) : (
              pedidosAbertos.map((pedido) => (
                <div key={pedido.id} style={styles.pedidoCard}>
                  <div>{pedido.descricao}</div>
                  {pedido.valor != null && (
                    <div style={styles.pedidoValor}>R$ {Number(pedido.valor).toFixed(2)}</div>
                  )}
                </div>
              ))
            )}
          </>
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
    borderBottom: '1px solid var(--vexo-border)',
  },
  marca: { fontSize: 20, fontWeight: 900, color: '#fff' },
  marcaDestaque: { color: 'var(--vexo-laranja)' },
  headerDireita: { display: 'flex', alignItems: 'center', gap: 12 },
  usuarioNome: { color: 'var(--vexo-text)', fontSize: 13 },
  sair: {
    background: 'transparent',
    border: '1px solid var(--vexo-border)',
    color: 'var(--vexo-muted)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
  },
  container: { maxWidth: 640, margin: '0 auto', padding: 24 },
  titulo: { color: '#fff', fontSize: 22, margin: 0 },
  localizacaoInfo: { color: 'var(--vexo-muted)', fontSize: 12, marginTop: 4, marginBottom: 12 },
  abas: { display: 'flex', background: 'var(--vexo-bg2)', borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 },
  aba: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--vexo-muted)',
    fontSize: 13,
    fontWeight: 600,
  },
  abaAtiva: { background: 'var(--vexo-roxo)', color: '#fff' },
  categorias: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg2)',
    color: 'var(--vexo-text)',
    fontSize: 12,
  },
  chipAtiva: { background: 'var(--vexo-roxo)', borderColor: 'var(--vexo-roxo)', color: '#fff' },
  erro: { color: 'var(--vexo-red)', fontSize: 13 },
  info: { color: 'var(--vexo-muted)', textAlign: 'center', marginTop: 32, fontSize: 13 },
  publicarWrapper: { marginBottom: 16 },
  botaoOutline: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--vexo-border)',
    background: 'transparent',
    color: 'var(--vexo-text)',
    fontWeight: 700,
  },
  formPedido: { display: 'flex', flexDirection: 'column', gap: 8 },
  textarea: {
    minHeight: 70,
    borderRadius: 12,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg2)',
    color: '#fff',
    padding: 12,
    fontSize: 14,
    resize: 'vertical',
  },
  input: {
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg2)',
    color: '#fff',
    padding: '0 14px',
    fontSize: 14,
  },
  botaoPrimario: {
    height: 44,
    borderRadius: 12,
    border: 'none',
    background: 'var(--vexo-roxo)',
    color: '#fff',
    fontWeight: 700,
  },
  pedidoCard: {
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    color: 'var(--vexo-text)',
  },
  pedidoValor: { color: 'var(--vexo-green)', fontWeight: 700, marginTop: 6 },
};
