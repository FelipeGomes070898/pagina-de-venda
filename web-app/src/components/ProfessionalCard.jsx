import { formatarDistancia } from '../utils/distancia';

const IconeEstrela = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7L12 2Z" />
  </svg>
);

export function ProfessionalCard({ prestador, onContatar, onAbrirPerfil, contatando, ocultarContato }) {
  const inicial = prestador.nome?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={styles.card}>
      <div style={styles.corpo} onClick={onAbrirPerfil}>
        <div style={styles.avatar}>{inicial}</div>

        <div style={styles.info}>
          <div style={styles.nome}>{prestador.nome}</div>
          <div style={styles.segmento}>{prestador.segmento || 'Serviços gerais'}</div>
          <div style={styles.linha}>
            <span style={styles.avaliacao}>
              <IconeEstrela /> {Number(prestador.avaliacao ?? 5).toFixed(1)} ({prestador.total_avaliacoes})
            </span>
            {prestador.distancia_km != null && (
              <span style={styles.distancia}>· {formatarDistancia(prestador.distancia_km)}</span>
            )}
          </div>
          {prestador.valor_servico != null && (
            <div style={styles.preco}>R$ {Number(prestador.valor_servico).toFixed(2)}</div>
          )}
          {prestador.servicos?.length > 0 && (
            <div style={styles.tambemFaz}>
              Também faz: {prestador.servicos.map((s) => s.categoria).join(', ')}
            </div>
          )}
        </div>
      </div>

      {!ocultarContato && (
        <button style={styles.botao} onClick={onContatar} disabled={contatando}>
          {contatando ? '...' : 'Contato'}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  corpo: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #F6AD3C, var(--konectaja-laranja-escuro))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 18,
    flexShrink: 0,
    boxShadow: '0 4px 10px rgba(180, 83, 9, 0.35)',
    border: '2.5px solid #fff',
  },
  info: { flex: 1, minWidth: 0 },
  nome: { color: 'var(--konectaja-text-forte)', fontWeight: 700, fontSize: 15 },
  segmento: { color: 'var(--konectaja-muted)', fontSize: 12, marginTop: 2 },
  linha: { color: 'var(--konectaja-text)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 },
  avaliacao: { display: 'flex', alignItems: 'center', gap: 4, color: '#D97706' },
  distancia: { color: 'var(--konectaja-muted)', marginLeft: 4 },
  preco: { color: 'var(--konectaja-laranja-escuro)', fontWeight: 800, fontSize: 14, marginTop: 4 },
  tambemFaz: { color: 'var(--konectaja-muted)', fontSize: 11, marginTop: 4 },
  botao: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    border: 'none',
    borderRadius: 12,
    padding: '9px 16px',
    fontWeight: 700,
    fontSize: 12,
    color: '#fff',
    flexShrink: 0,
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
};
