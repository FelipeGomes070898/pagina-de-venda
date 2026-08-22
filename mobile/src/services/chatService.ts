import { api } from './api';
import { Pedido } from './marketplaceService';

export type RemetenteTipo = 'cliente' | 'prestador' | 'sistema';

export interface Mensagem {
  id: string;
  pedido_id: string;
  remetente_id: string | null;
  remetente_tipo: RemetenteTipo;
  conteudo: string;
  tipo: 'texto' | 'proposta' | 'sistema';
  criado_em: string;
}

export interface Proposta {
  id: string;
  pedido_id: string;
  remetente_id: string;
  remetente_tipo: 'cliente' | 'prestador';
  valor: number;
  descricao: string | null;
  status: 'pendente' | 'aceita' | 'recusada';
  criado_em: string;
}

export interface Conversa {
  pedido: Pedido;
  mensagens: Mensagem[];
  propostas: Proposta[];
}

export async function listarConversa(pedidoId: string): Promise<Conversa> {
  const { data } = await api.get<Conversa>(`/api/chat/${pedidoId}`);
  return data;
}

export async function enviarMensagem(pedidoId: string, conteudo: string): Promise<Mensagem> {
  const { data } = await api.post<Mensagem>(`/api/chat/${pedidoId}`, { conteudo });
  return data;
}

export async function enviarProposta(
  pedidoId: string,
  payload: { valor: number; descricao?: string },
): Promise<Proposta> {
  const { data } = await api.post<Proposta>(`/api/chat/${pedidoId}/proposta`, payload);
  return data;
}

export async function responderProposta(
  pedidoId: string,
  propostaId: string,
  acao: 'aceitar' | 'recusar',
): Promise<Proposta> {
  const { data } = await api.patch<Proposta>(`/api/chat/${pedidoId}/proposta/${propostaId}`, {
    acao,
  });
  return data;
}

export async function enviarEndereco(
  pedidoId: string,
  payload: { endereco: string; lat?: number; lng?: number },
): Promise<Pedido> {
  const { data } = await api.put<Pedido>(`/api/pedidos/${pedidoId}/endereco`, payload);
  return data;
}
