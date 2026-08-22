import { api } from './api';

export interface AvaliacaoPayload {
  pedidoId: string;
  nota: number;
  comentario?: string;
  tags?: string[];
}

export interface Avaliacao {
  id: string;
  prestador_id: string;
  cliente_id: string;
  pedido_id: string;
  nota: number;
  comentario: string | null;
  tags: string[];
  criado_em: string;
}

export const TAGS_AVALIACAO = [
  'Pontual',
  'Educado',
  'Preço justo',
  'Trabalho de qualidade',
  'Recomendo',
];

export async function avaliarPrestador(payload: AvaliacaoPayload): Promise<Avaliacao> {
  const { data } = await api.post<Avaliacao>('/api/avaliacoes', payload);
  return data;
}
