import { api } from './api';

// Espelha reviewService.ts, na direção prestador → cliente.
export interface AvaliacaoClientePayload {
  pedidoId: string;
  nota: number;
  comentario?: string;
  tags?: string[];
}

export interface AvaliacaoCliente {
  id: string;
  cliente_id: string;
  prestador_id: string;
  pedido_id: string;
  nota: number;
  comentario: string | null;
  tags: string[];
  criado_em: string;
}

export const TAGS_AVALIACAO_CLIENTE = [
  'Pontual',
  'Educado',
  'Ofereceu água/café',
  'Ambiente organizado',
  'Recomendo atender',
];

export async function avaliarCliente(payload: AvaliacaoClientePayload): Promise<AvaliacaoCliente> {
  const { data } = await api.post<AvaliacaoCliente>('/api/avaliacoes-clientes', payload);
  return data;
}
