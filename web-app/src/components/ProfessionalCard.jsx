export function ProfessionalCard({ prestador, onContatar, onAbrirPerfil, contatando }) {
  const inicial = prestador.nome?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={styles.card}>
      <div style={styles.corpo} onClick={onAbrirPerfil}>
        <div style={styles.avatar}>{inicial}</div>

        <div style={styles.info}>
          <div style={styles.nome}>{prestador.nome}</div>
          <div style={styles.segmento}>{prestador.segmento || 'Serviços gerais'}</div>
          <div style={styles.linha}>
            <span>
              ⭐ {Number(prestador.avaliacao ?? 5).toFixed(1)} ({prestador.total_avaliacoes})
            </span>
            {prestador.distancia_km != null && (
              <span style={styles.distancia}>· {formatarDistancia(prestador.distancia_km)}</span>
            )}
          </div>
          {prestador.valor_servico != null && (
            <div style={styles.preco}>R$ {Number(prestador.valor_servico).toFixed(2)}</div>
          )}
        </div>
      </div>

      <button style={styles.botao} onClick={onContatar} disabled={contatando}>
        {contatando ? '...' : 'Contato'}
      </button>
    </div>
  );
}

function formatarDistancia(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  corpo: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: 'var(--vexo-roxo)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 18,
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  nome: { color: '#fff', fontWeight: 700, fontSize: 15 },
  segmento: { color: 'var(--vexo-muted)', fontSize: 12, marginTop: 2 },
  linha: { color: 'var(--vexo-text)', fontSize: 12, marginTop: 4 },
  distancia: { color: 'var(--vexo-muted)', marginLeft: 4 },
  preco: { color: 'var(--vexo-green)', fontWeight: 700, fontSize: 14, marginTop: 4 },
  botao: {
    background: 'var(--vexo-laranja)',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 700,
    fontSize: 12,
    color: '#1a1a1a',
    flexShrink: 0,
  },
};
