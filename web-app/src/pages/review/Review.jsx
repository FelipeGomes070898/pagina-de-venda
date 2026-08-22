import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PrimaryButton } from '../../components/PrimaryButton';
import { avaliarPrestador, TAGS_AVALIACAO } from '../../services/reviewService';

const ESTRELAS = [1, 2, 3, 4, 5];

export function Review() {
  const { pedidoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const prestadorNome = location.state?.prestadorNome || 'o prestador';

  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  function alternarTag(tag) {
    setTagsSelecionadas((atual) => (atual.includes(tag) ? atual.filter((t) => t !== tag) : [...atual, tag]));
  }

  async function aoEnviar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await avaliarPrestador({ pedidoId, nota, comentario: comentario.trim() || undefined, tags: tagsSelecionadas });
      navigate('/');
    } catch {
      setErro('Não foi possível enviar sua avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={aoEnviar}>
        <h1 style={styles.titulo}>Como foi o serviço?</h1>
        <p style={styles.subtitulo}>Avalie {prestadorNome}</p>

        <div style={styles.estrelas}>
          {ESTRELAS.map((valor) => (
            <button
              type="button"
              key={valor}
              style={{ ...styles.estrela, ...(valor <= nota ? styles.estrelaAtiva : {}) }}
              onClick={() => setNota(valor)}
            >
              ★
            </button>
          ))}
        </div>

        <p style={styles.rotulo}>O que se destacou?</p>
        <div style={styles.tags}>
          {TAGS_AVALIACAO.map((tag) => (
            <button
              type="button"
              key={tag}
              style={{ ...styles.tag, ...(tagsSelecionadas.includes(tag) ? styles.tagAtiva : {}) }}
              onClick={() => alternarTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          style={styles.textarea}
          placeholder="Deixe um comentário (opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />

        {erro && <p style={styles.erro}>{erro}</p>}

        <PrimaryButton label="Enviar avaliação" type="submit" loading={enviando} />
      </form>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: 420,
    maxWidth: '100%',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 18,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  titulo: { color: '#fff', fontSize: 22, margin: 0, textAlign: 'center' },
  subtitulo: { textAlign: 'center', color: 'var(--vexo-muted)', fontSize: 13, marginBottom: 8 },
  estrelas: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 },
  estrela: { fontSize: 36, color: 'var(--vexo-border)', background: 'transparent', border: 'none' },
  estrelaAtiva: { color: 'var(--vexo-laranja)' },
  rotulo: { color: 'var(--vexo-text)', fontSize: 13, fontWeight: 600, margin: '4px 0 0' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: {
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg3)',
    color: 'var(--vexo-text)',
    fontSize: 12,
  },
  tagAtiva: { background: 'var(--vexo-roxo)', borderColor: 'var(--vexo-roxo)', color: '#fff' },
  textarea: {
    minHeight: 80,
    borderRadius: 12,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg3)',
    color: '#fff',
    padding: 12,
    fontSize: 14,
    resize: 'vertical',
  },
  erro: { color: 'var(--vexo-red)', fontSize: 13, margin: 0, textAlign: 'center' },
};
