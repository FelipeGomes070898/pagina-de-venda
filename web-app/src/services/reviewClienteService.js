import { api } from './api';

// Espelha reviewService.js, na direção prestador → cliente.
export const TAGS_AVALIACAO_CLIENTE = [
  'Pontual',
  'Educado',
  'Ofereceu água/café',
  'Ambiente organizado',
  'Recomendo atender',
];

export async function avaliarCliente({ pedidoId, nota, comentario, tags }) {
  const { data } = await api.post('/api/avaliacoes-clientes', { pedidoId, nota, comentario, tags });
  return data;
}
