import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PrimaryButton } from '../../components/PrimaryButton';
import { avaliarCliente, TAGS_AVALIACAO_CLIENTE } from '../../services/reviewClienteService';

const ESTRELAS = [1, 2, 3, 4, 5];

// Espelha Review.jsx, na direção prestador → cliente (pontualidade,
// educação, ofereceu água/café...). Essa nota nunca entra na avaliação
// do prestador — é só informativa.
export function ReviewCliente() {
  const { pedidoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const clienteNome = location.state?.clienteNome || 'o cliente';

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
      await avaliarCliente({ pedidoId, nota, comentario: comentario.trim() || undefined, tags: tagsSelecionadas });
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
        <h1 style={styles.titulo}>Como foi atender esse cliente?</h1>
        <p style={styles.subtitulo}>Avalie {clienteNome}</p>

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
          {TAGS_AVALIACAO_CLIENTE.map((tag) => (
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
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 22,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 22, margin: 0, textAlign: 'center', fontWeight: 800 },
  subtitulo: { textAlign: 'center', color: 'var(--konectaja-muted)', fontSize: 13, marginBottom: 8 },
  estrelas: { display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 },
  estrela: { fontSize: 36, color: 'var(--konectaja-border)', background: 'transparent', border: 'none' },
  estrelaAtiva: { color: 'var(--konectaja-laranja)' },
  rotulo: { color: 'var(--konectaja-text)', fontSize: 13, fontWeight: 700, margin: '4px 0 0' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: {
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text)',
    fontSize: 11,
    fontWeight: 700,
  },
  tagAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    borderColor: 'var(--konectaja-laranja)',
    color: '#fff',
  },
  textarea: {
    minHeight: 80,
    borderRadius: 14,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: 12,
    fontSize: 14,
    resize: 'vertical',
  },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, margin: 0, textAlign: 'center' },
};
