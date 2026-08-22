import { api } from './api';

export const TAGS_AVALIACAO = [
  'Pontual',
  'Educado',
  'Preço justo',
  'Trabalho de qualidade',
  'Recomendo',
];

export async function avaliarPrestador({ pedidoId, nota, comentario, tags }) {
  const { data } = await api.post('/api/avaliacoes', { pedidoId, nota, comentario, tags });
  return data;
}
