import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from '../../components/BottomNav';
import { ProfessionalCard } from '../../components/ProfessionalCard';
import { CATEGORIAS } from '../../constants/categorias';
import { obterLocalizacaoAtual } from '../../services/locationService';
import {
  contatarPrestador,
  listarBannersAtivos,
  listarPedidosAbertos,
  listarPrestadores,
  publicarPedidoAberto,
  validarCupom,
} from '../../services/marketplaceService';
import { mensagemErro } from '../../utils/erro';

export function ClienteMarketplace() {
  const cidadeUsuario = useAuthStore((s) => s.usuario?.cidade);
  const navigate = useNavigate();

  const [aba, setAba] = useState('prestadores');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
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
  const [urgente, setUrgente] = useState(false);
  const [cupomTexto, setCupomTexto] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [cupomErro, setCupomErro] = useState(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const [banners, setBanners] = useState([]);

  useEffect(() => {
    obterLocalizacaoAtual()
      .then(setCoordenadas)
      .finally(() => setBuscandoLocalizacao(false));
    listarBannersAtivos()
      .then(setBanners)
      .catch(() => {});
  }, []);

  async function aoAplicarCupom() {
    if (!cupomTexto.trim()) return;
    setCupomErro(null);
    setValidandoCupom(true);
    try {
      const resultado = await validarCupom(cupomTexto.trim(), Number(valorPedido.replace(',', '.')) || 0);
      setCupomAplicado(resultado);
    } catch (erro) {
      setCupomAplicado(null);
      setCupomErro(mensagemErro(erro, 'Cupom inválido ou expirado'));
    } finally {
      setValidandoCupom(false);
    }
  }

  async function carregar() {
    setErro(null);
    try {
      if (aba === 'prestadores') {
        const lista = await listarPrestadores({
          segmento: categoriaAtiva || undefined,
          busca: buscaAplicada || undefined,
          cidade: cidadeUsuario || undefined,
          lat: coordenadas?.lat,
          lng: coordenadas?.lng,
        });
        setPrestadores(lista);
      } else {
        const lista = await listarPedidosAbertos();
        setPedidosAbertos(lista);
      }
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível carregar. Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (buscandoLocalizacao) return;
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, categoriaAtiva, buscaAplicada, buscandoLocalizacao, cidadeUsuario]);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(buscaTexto.trim()), 400);
    return () => clearTimeout(temporizador);
  }, [buscaTexto]);

  async function aoContatar(prestador) {
    setContatandoId(prestador.id);
    try {
      const pedido = await contatarPrestador(prestador.id);
      navigate(`/chat/${pedido.id}`, { state: { prestadorNome: prestador.nome } });
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível entrar em contato agora.'));
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
        urgente,
        cupomCodigo: cupomAplicado?.codigo,
      });
      setDescricaoPedido('');
      setValorPedido('');
      setUrgente(false);
      setCupomTexto('');
      setCupomAplicado(null);
      setMostrarFormPedido(false);
      carregar();
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível publicar seu pedido.'));
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div style={styles.pagina}>
      <BottomNav />

      <main style={styles.container}>
        {banners.length > 0 && (
          <div style={styles.banners}>
            {banners.map((b) =>
              b.link_url ? (
                <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" style={styles.bannerLink}>
                  <img src={b.imagem_url} alt={b.titulo || ''} style={styles.bannerImg} />
                </a>
              ) : (
                <img key={b.id} src={b.imagem_url} alt={b.titulo || ''} style={styles.bannerImg} />
              ),
            )}
          </div>
        )}

        <h1 style={styles.titulo}>Marketplace</h1>
        {aba === 'prestadores' && (
          <input
            style={styles.buscaInput}
            placeholder="Buscar por nome ou serviço"
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
          />
        )}
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
                onAbrirPerfil={() => navigate(`/prestador/${p.id}`)}
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

                  <label style={styles.urgenteLabel}>
                    <input
                      type="checkbox"
                      checked={urgente}
                      onChange={(e) => setUrgente(e.target.checked)}
                    />
                    Marcar como urgente (prioridade na lista, taxa adicional)
                  </label>

                  <div style={styles.cupomLinha}>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="Cupom de desconto (opcional)"
                      value={cupomTexto}
                      onChange={(e) => setCupomTexto(e.target.value.toUpperCase())}
                      disabled={Boolean(cupomAplicado)}
                    />
                    {!cupomAplicado ? (
                      <button
                        style={styles.botaoOutline}
                        onClick={aoAplicarCupom}
                        disabled={validandoCupom || !cupomTexto.trim()}
                        type="button"
                      >
                        {validandoCupom ? 'Validando...' : 'Aplicar'}
                      </button>
                    ) : (
                      <button
                        style={styles.botaoOutline}
                        onClick={() => {
                          setCupomAplicado(null);
                          setCupomTexto('');
                        }}
                        type="button"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  {cupomErro && <p style={styles.erro}>{cupomErro}</p>}
                  {cupomAplicado && (
                    <p style={styles.cupomSucesso}>
                      Cupom {cupomAplicado.codigo} aplicado — desconto de R$ {cupomAplicado.desconto.toFixed(2)}
                    </p>
                  )}

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
                  {pedido.urgente && <span style={styles.badgeUrgente}>URGENTE</span>}
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
  container: { maxWidth: 640, margin: '0 auto', padding: '24px 24px 104px' },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 22, margin: '0 0 12px' },
  buscaInput: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 14,
    marginBottom: 8,
  },
  localizacaoInfo: { color: 'var(--konectaja-muted)', fontSize: 12, marginTop: 4, marginBottom: 12 },
  abas: { display: 'flex', background: 'var(--konectaja-bg2)', borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 },
  aba: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-muted)',
    fontSize: 13,
    fontWeight: 600,
  },
  abaAtiva: { background: 'var(--konectaja-laranja)', color: '#fff' },
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
  publicarWrapper: { marginBottom: 16 },
  botaoOutline: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'transparent',
    color: 'var(--konectaja-text)',
    fontWeight: 700,
  },
  formPedido: { display: 'flex', flexDirection: 'column', gap: 8 },
  textarea: {
    minHeight: 70,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: 12,
    fontSize: 14,
    resize: 'vertical',
  },
  input: {
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 14,
  },
  botaoPrimario: {
    height: 44,
    borderRadius: 12,
    border: 'none',
    background: 'var(--konectaja-laranja)',
    color: '#fff',
    fontWeight: 700,
  },
  pedidoCard: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    color: 'var(--konectaja-text)',
  },
  pedidoValor: { color: 'var(--konectaja-green)', fontWeight: 700, marginTop: 6 },
  banners: { display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 16 },
  bannerLink: { flexShrink: 0 },
  bannerImg: {
    width: 280,
    height: 110,
    objectFit: 'cover',
    borderRadius: 14,
    flexShrink: 0,
    display: 'block',
  },
  urgenteLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--konectaja-text)',
    fontSize: 13,
  },
  cupomLinha: { display: 'flex', gap: 8 },
  cupomSucesso: { color: 'var(--konectaja-green)', fontSize: 12.5 },
  badgeUrgente: {
    display: 'inline-block',
    background: 'var(--konectaja-red)',
    color: '#fff',
    fontSize: 10.5,
    fontWeight: 800,
    borderRadius: 6,
    padding: '2px 8px',
    marginBottom: 6,
  },
};
