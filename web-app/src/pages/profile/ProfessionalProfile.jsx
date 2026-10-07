import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { buscarPrestador, contatarPrestador } from '../../services/marketplaceService';
import { obterLocalizacaoAtual } from '../../services/locationService';
import { formatarDistancia } from '../../utils/distancia';

const IconeEstrela = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: '-2px' }}>
    <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7L12 2Z" />
  </svg>
);

const IconeVoltar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const IconeCompartilhar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.5 15.4 6.8M8.6 13.5l6.8 3.7" />
  </svg>
);

export function ProfessionalProfile() {
  const { prestadorId } = useParams();
  const navigate = useNavigate();
  const meuTipo = useAuthStore((s) => s.usuario?.tipo);

  const [prestador, setPrestador] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [contatando, setContatando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    obterLocalizacaoAtual()
      .then((coordenadas) => buscarPrestador(prestadorId, coordenadas || {}))
      .then(setPrestador)
      .catch(() => setErro('Não foi possível carregar este perfil.'))
      .finally(() => setCarregando(false));
  }, [prestadorId]);

  async function aoContatar() {
    setContatando(true);
    try {
      const pedido = await contatarPrestador(prestadorId);
      navigate(`/chat/${pedido.id}`, { state: { prestadorNome: prestador.nome } });
    } catch {
      setErro('Não foi possível entrar em contato agora.');
    } finally {
      setContatando(false);
    }
  }

  async function aoCompartilhar() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${prestador.nome} — Konecta Já`, url });
      } catch {
        // usuário cancelou o compartilhamento — nada a fazer
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copiado!');
    }
  }

  if (carregando) return <div style={styles.centro}>Carregando...</div>;
  if (erro || !prestador) return <div style={styles.centro}>{erro || 'Prestador não encontrado.'}</div>;

  return (
    <div style={styles.pagina}>
      <div style={styles.header}>
        <button style={styles.voltar} onClick={() => navigate('/')}>
          <IconeVoltar /> Marketplace
        </button>
        <button style={styles.voltar} onClick={aoCompartilhar}>
          Compartilhar <IconeCompartilhar />
        </button>
      </div>

      <div style={styles.container}>
        {prestador.foto_url ? (
          <img src={prestador.foto_url} alt={prestador.nome} style={styles.fotoPerfil} />
        ) : (
          <div style={styles.avatar}>{prestador.nome.charAt(0).toUpperCase()}</div>
        )}
        <h1 style={styles.nome}>{prestador.nome}</h1>
        <p style={styles.segmento}>{prestador.segmento || 'Serviços gerais'}</p>

        <p style={styles.linhaInfo}>
          <IconeEstrela /> {Number(prestador.avaliacao ?? 5).toFixed(1)} ({prestador.total_avaliacoes} avaliações) ·{' '}
          {prestador.total_servicos} serviços feitos
          {prestador.distancia_km != null && <> · {formatarDistancia(prestador.distancia_km)} de você</>}
        </p>

        {prestador.valor_servico != null && (
          <p style={styles.preco}>A partir de R$ {Number(prestador.valor_servico).toFixed(2)}</p>
        )}

        {prestador.bio && <p style={styles.bio}>{prestador.bio}</p>}

        {prestador.servicos?.length > 0 && (
          <div style={styles.secao}>
            <h2 style={styles.secaoTitulo}>Outros serviços que faz</h2>
            <div style={styles.listaServicos}>
              {prestador.servicos.map((servico) => (
                <div key={servico.id} style={styles.itemServico}>
                  <span>{servico.categoria}</span>
                  {servico.valor != null && (
                    <span style={styles.itemServicoValor}>R$ {Number(servico.valor).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {prestador.fotos?.length > 0 && (
          <div style={styles.secao}>
            <h2 style={styles.secaoTitulo}>Trabalhos anteriores</h2>
            <div style={styles.fotos}>
              {prestador.fotos.map((foto) => (
                <img key={foto.id} src={foto.url} alt={foto.legenda || ''} style={styles.foto} />
              ))}
            </div>
          </div>
        )}

        <div style={styles.secao}>
          <h2 style={styles.secaoTitulo}>Avaliações</h2>
          {prestador.avaliacoes?.length === 0 || !prestador.avaliacoes ? (
            <p style={styles.semAvaliacoes}>Ainda sem avaliações.</p>
          ) : (
            prestador.avaliacoes.map((av) => (
              <div key={av.id} style={styles.avaliacaoCard}>
                <div style={styles.avaliacaoHeader}>
                  <span style={styles.avaliacaoNome}>{av.cliente_nome}</span>
                  <span style={{ color: 'var(--konectaja-laranja)', display: 'flex', gap: 1 }}>
                    {Array.from({ length: av.nota }).map((_, i) => <IconeEstrela key={i} size={12} />)}
                  </span>
                </div>
                {av.comentario && <p style={styles.avaliacaoComentario}>{av.comentario}</p>}
              </div>
            ))
          )}
        </div>

        {erro && <p style={styles.erroTexto}>{erro}</p>}

        {meuTipo === 'prestador' ? (
          <p style={styles.avisoChat}>
            Você está vendo este perfil como prestador. Só clientes podem solicitar serviço.
          </p>
        ) : (
          <>
            <button style={styles.botaoContato} onClick={aoContatar} disabled={contatando}>
              {contatando ? 'Entrando em contato...' : 'Solicitar serviço'}
            </button>
            <p style={styles.avisoChat}>
              A conversa com {prestador.nome} acontece aqui dentro do app, no chat do pedido.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  centro: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--konectaja-muted)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  voltar: {
    background: 'transparent',
    border: 'none',
    color: 'var(--konectaja-text)',
    fontSize: 13,
    fontWeight: 700,
    padding: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  container: { maxWidth: 480, margin: '0 auto', padding: '0 24px 32px' },
  fotoPerfil: {
    width: 120,
    height: 120,
    borderRadius: 999,
    objectFit: 'cover',
    background: 'var(--konectaja-bg2)',
    display: 'block',
    margin: '0 auto 16px',
    border: '3px solid #fff',
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #F6AD3C, var(--konectaja-laranja-escuro))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 48,
    margin: '0 auto 16px',
    border: '3px solid #fff',
    boxShadow: '0 4px 14px rgba(180, 83, 9, 0.35)',
  },
  nome: { color: 'var(--konectaja-text-forte)', fontSize: 20, textAlign: 'center', margin: 0, fontWeight: 800 },
  segmento: { color: 'var(--konectaja-muted)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  linhaInfo: { color: 'var(--konectaja-text)', fontSize: 13, textAlign: 'center', marginTop: 8 },
  preco: { color: 'var(--konectaja-laranja-escuro)', fontWeight: 800, fontSize: 18, textAlign: 'center', marginTop: 8 },
  bio: { color: 'var(--konectaja-text)', fontSize: 14, textAlign: 'center', marginTop: 16 },
  secao: { marginTop: 32 },
  secaoTitulo: { color: 'var(--konectaja-text-forte)', fontSize: 15, fontWeight: 700, marginBottom: 8 },
  listaServicos: { display: 'flex', flexDirection: 'column', gap: 8 },
  itemServico: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: '10px 14px',
    fontSize: 13,
    color: 'var(--konectaja-text)',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  itemServicoValor: { color: 'var(--konectaja-laranja-escuro)', fontWeight: 700 },
  fotos: { display: 'flex', gap: 8, overflowX: 'auto' },
  foto: { width: 110, height: 110, borderRadius: 16, objectFit: 'cover', background: 'var(--konectaja-bg2)' },
  semAvaliacoes: { color: 'var(--konectaja-muted)', fontSize: 13 },
  avaliacaoCard: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  avaliacaoHeader: { display: 'flex', justifyContent: 'space-between' },
  avaliacaoNome: { color: 'var(--konectaja-text-forte)', fontWeight: 600, fontSize: 13 },
  avaliacaoComentario: { color: 'var(--konectaja-text)', fontSize: 13, marginTop: 4 },
  erroTexto: { color: 'var(--konectaja-red)', fontSize: 13, textAlign: 'center', marginTop: 16 },
  botaoContato: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 32,
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  avisoChat: {
    color: 'var(--konectaja-muted)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
};
