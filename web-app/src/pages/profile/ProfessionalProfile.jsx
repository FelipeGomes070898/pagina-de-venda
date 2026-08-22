import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarPrestador, contatarPrestador } from '../../services/marketplaceService';

export function ProfessionalProfile() {
  const { prestadorId } = useParams();
  const navigate = useNavigate();

  const [prestador, setPrestador] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [contatando, setContatando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarPrestador(prestadorId)
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

  if (carregando) return <div style={styles.centro}>Carregando...</div>;
  if (erro || !prestador) return <div style={styles.centro}>{erro || 'Prestador não encontrado.'}</div>;

  return (
    <div style={styles.pagina}>
      <button style={styles.voltar} onClick={() => navigate('/')}>
        ← Marketplace
      </button>

      <div style={styles.container}>
        <div style={styles.avatar}>{prestador.nome.charAt(0).toUpperCase()}</div>
        <h1 style={styles.nome}>{prestador.nome}</h1>
        <p style={styles.segmento}>{prestador.segmento || 'Serviços gerais'}</p>

        <p style={styles.linhaInfo}>
          ⭐ {Number(prestador.avaliacao ?? 5).toFixed(1)} ({prestador.total_avaliacoes} avaliações) ·{' '}
          {prestador.total_servicos} serviços feitos
        </p>

        {prestador.valor_servico != null && (
          <p style={styles.preco}>A partir de R$ {Number(prestador.valor_servico).toFixed(2)}</p>
        )}

        {prestador.bio && <p style={styles.bio}>{prestador.bio}</p>}

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
                  <span>{'⭐'.repeat(av.nota)}</span>
                </div>
                {av.comentario && <p style={styles.avaliacaoComentario}>{av.comentario}</p>}
              </div>
            ))
          )}
        </div>

        {erro && <p style={styles.erroTexto}>{erro}</p>}

        <button style={styles.botaoContato} onClick={aoContatar} disabled={contatando}>
          {contatando ? 'Entrando em contato...' : 'Entrar em contato'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  centro: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vexo-muted)' },
  voltar: { background: 'transparent', border: 'none', color: 'var(--vexo-muted)', fontSize: 13, padding: 16, cursor: 'pointer' },
  container: { maxWidth: 480, margin: '0 auto', padding: '0 24px 32px' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    background: 'var(--vexo-roxo)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 36,
    margin: '0 auto 16px',
  },
  nome: { color: '#fff', fontSize: 20, textAlign: 'center', margin: 0 },
  segmento: { color: 'var(--vexo-muted)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  linhaInfo: { color: 'var(--vexo-text)', fontSize: 13, textAlign: 'center', marginTop: 8 },
  preco: { color: 'var(--vexo-green)', fontWeight: 800, fontSize: 18, textAlign: 'center', marginTop: 8 },
  bio: { color: 'var(--vexo-text)', fontSize: 14, textAlign: 'center', marginTop: 16 },
  secao: { marginTop: 32 },
  secaoTitulo: { color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 8 },
  fotos: { display: 'flex', gap: 8, overflowX: 'auto' },
  foto: { width: 110, height: 110, borderRadius: 12, objectFit: 'cover', background: 'var(--vexo-bg2)' },
  semAvaliacoes: { color: 'var(--vexo-muted)', fontSize: 13 },
  avaliacaoCard: { background: 'var(--vexo-bg2)', border: '1px solid var(--vexo-border)', borderRadius: 12, padding: 14, marginBottom: 8 },
  avaliacaoHeader: { display: 'flex', justifyContent: 'space-between' },
  avaliacaoNome: { color: '#fff', fontWeight: 600, fontSize: 13 },
  avaliacaoComentario: { color: 'var(--vexo-text)', fontSize: 13, marginTop: 4 },
  erroTexto: { color: 'var(--vexo-red)', fontSize: 13, textAlign: 'center', marginTop: 16 },
  botaoContato: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: 'none',
    background: 'var(--vexo-roxo)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 32,
  },
};
