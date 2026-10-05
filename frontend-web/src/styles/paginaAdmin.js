// Estilos compartilhados entre as páginas do painel (listagens em
// tabela, filtros, cards de resumo) — evita repetir o mesmo objeto em
// cada página, igual ao padrão usado em Equipe.jsx.
export const estilosPagina = {
  container: { padding: 32 },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 22, margin: 0 },
  subtitulo: { color: 'var(--konectaja-muted)', fontSize: 13, marginTop: 4, marginBottom: 24 },
  filtros: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  input: {
    height: 42,
    borderRadius: 8,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 10px',
    fontSize: 13,
    minWidth: 200,
  },
  botao: {
    height: 42,
    borderRadius: 8,
    border: 'none',
    background: 'var(--konectaja-laranja)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 16px',
  },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, marginBottom: 12 },
  sucesso: { color: 'var(--konectaja-verde)', fontSize: 13, marginBottom: 12 },
  info: { color: 'var(--konectaja-muted)' },
  tabela: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    color: 'var(--konectaja-muted)',
    fontSize: 12,
    padding: '8px 12px',
    borderBottom: '1px solid var(--konectaja-border)',
  },
  td: {
    color: 'var(--konectaja-text)',
    fontSize: 13,
    padding: '10px 12px',
    borderBottom: '1px solid var(--konectaja-border)',
  },
  linkBotao: {
    background: 'transparent',
    border: 'none',
    color: 'var(--konectaja-azul)',
    cursor: 'pointer',
    fontSize: 13,
    padding: 0,
  },
  paginacao: { display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 28,
  },
  card: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: 20,
  },
  cardLabel: { color: 'var(--konectaja-muted)', fontSize: 12 },
  cardValor: { color: 'var(--konectaja-text-forte)', fontSize: 26, fontWeight: 800, marginTop: 6 },
};

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(data) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}
