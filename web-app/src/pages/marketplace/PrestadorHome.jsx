import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from '../../components/BottomNav';
import { ProfessionalCard } from '../../components/ProfessionalCard';
import { CATEGORIAS } from '../../constants/categorias';
import { meuPerfil } from '../../services/authService';
import {
  listarPedidosAbertos,
  listarPrestadores,
  responderPedidoAberto,
} from '../../services/marketplaceService';
import { mensagemErro } from '../../utils/erro';

const IconeEstrela = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 2 }}>
    <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7L12 2Z" />
  </svg>
);

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
  const cidadeUsuario = useAuthStore((s) => s.usuario?.cidade);
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [aba, setAba] = useState('pedidos');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [outrosPrestadores, setOutrosPrestadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [respondendoId, setRespondendoId] = useState(null);
  const [erro, setErro] = useState(null);

  async function carregar() {
    setErro(null);
    try {
      if (aba === 'pedidos') {
        const [listaPedidos] = await Promise.all([
          listarPedidosAbertos({ cidade: cidadeUsuario || undefined, segmento: categoriaAtiva || undefined }),
          meuPerfil().then(setPerfil),
        ]);
        setPedidos(listaPedidos);
      } else {
        const [listaPrestadores] = await Promise.all([
          listarPrestadores({ cidade: cidadeUsuario || undefined, segmento: categoriaAtiva || undefined }),
          meuPerfil().then(setPerfil),
        ]);
        setOutrosPrestadores(listaPrestadores);
      }
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível carregar. Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, categoriaAtiva, cidadeUsuario]);

  async function aoResponder(pedido) {
    setRespondendoId(pedido.id);
    setErro(null);
    try {
      await responderPedidoAberto(pedido.id);
      navigate(`/chat/${pedido.id}`, { state: { prestadorNome: '' } });
    } catch (erro) {
      setErro(
        mensagemErro(
          erro,
          'Esse pedido já não está mais disponível — outro prestador deve ter respondido primeiro.',
        ),
      );
      setPedidos((atual) => atual.filter((p) => p.id !== pedido.id));
    } finally {
      setRespondendoId(null);
    }
  }

  const status = perfil?.status ? ROTULO_STATUS[perfil.status] : null;

  return (
    <div style={styles.pagina}>
      <BottomNav />

      <main style={styles.container}>
        <h1 style={styles.titulo}>Olá, {perfil?.nome?.split(' ')[0] || ''}</h1>

        <div style={styles.statsCard}>
          <div style={styles.statItem}>
            <div style={styles.statValor}><IconeEstrela />{Number(perfil?.avaliacao ?? 5).toFixed(1)}</div>
            <div style={styles.statLabel}>{perfil?.total_avaliacoes ?? 0} avaliações</div>
          </div>
          <div style={styles.statDivisor} />
          <div style={styles.statItem}>
            <div style={styles.statValor}>{perfil?.total_servicos ?? 0}</div>
            <div style={styles.statLabel}>serviços feitos</div>
          </div>
        </div>

        <div style={styles.linhaStatusMapa}>
          {status && (
            <div style={{ ...styles.statusChip, borderColor: status.cor }}>
              <span style={{ ...styles.statusBolinha, background: status.cor }} />
              <span style={{ color: status.cor, fontWeight: 700, fontSize: 12 }}>{status.texto}</span>
            </div>
          )}
          <button style={styles.botaoMapa} onClick={() => navigate('/mapa-trabalhadores')}>
            🗺️ Ver mapa de trabalhadores
          </button>
        </div>

        <div style={styles.abas}>
          <button
            style={{ ...styles.aba, ...(aba === 'pedidos' ? styles.abaAtiva : {}) }}
            onClick={() => setAba('pedidos')}
          >
            Pedidos em aberto
          </button>
          <button
            style={{ ...styles.aba, ...(aba === 'prestadores' ? styles.abaAtiva : {}) }}
            onClick={() => setAba('prestadores')}
          >
            Outros prestadores
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
        ) : aba === 'pedidos' ? (
          pedidos.length === 0 ? (
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
          )
        ) : outrosPrestadores.length === 0 ? (
          <p style={styles.info}>Nenhum outro prestador na sua cidade ainda.</p>
        ) : (
          outrosPrestadores.map((p) => (
            <ProfessionalCard
              key={p.id}
              prestador={p}
              onAbrirPerfil={() => navigate(`/prestador/${p.id}`)}
              ocultarContato
            />
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
  linhaStatusMapa: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  botaoMapa: {
    height: 36,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    fontWeight: 700,
    fontSize: 12.5,
  },
  statsCard: {
    display: 'flex',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 18,
    padding: 20,
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  statItem: { flex: 1, textAlign: 'center' },
  statDivisor: { width: 1, background: 'var(--konectaja-border)' },
  statValor: { fontSize: 22, fontWeight: 800, color: 'var(--konectaja-text-forte)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 },
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
  abas: {
    display: 'flex',
    background: 'var(--konectaja-bg3)',
    borderRadius: 14,
    padding: 5,
    gap: 4,
    marginTop: 24,
    marginBottom: 16,
    border: '1px solid var(--konectaja-border)',
  },
  aba: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-muted)',
    fontSize: 13,
    fontWeight: 700,
  },
  abaAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  categorias: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
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
  erro: { color: 'var(--konectaja-red)', fontSize: 13 },
  info: { color: 'var(--konectaja-muted)', textAlign: 'center', marginTop: 32, fontSize: 13 },
  pedidoCard: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    color: 'var(--konectaja-text)',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  pedidoRodape: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  pedidoValor: { color: 'var(--konectaja-verde)', fontWeight: 700 },
  pedidoSemValor: { color: 'var(--konectaja-muted)', fontSize: 12, fontStyle: 'italic' },
  botaoResponder: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    border: 'none',
    borderRadius: 10,
    padding: '9px 16px',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
};
