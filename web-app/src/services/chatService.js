import { api } from './api';

export async function listarConversa(pedidoId) {
  const { data } = await api.get(`/api/chat/${pedidoId}`);
  return data;
}

export async function enviarMensagem(pedidoId, conteudo) {
  const { data } = await api.post(`/api/chat/${pedidoId}`, { conteudo });
  return data;
}

export async function enviarProposta(pedidoId, { valor, descricao }) {
  const { data } = await api.post(`/api/chat/${pedidoId}/proposta`, { valor, descricao });
  return data;
}

export async function responderProposta(pedidoId, propostaId, acao) {
  const { data } = await api.patch(`/api/chat/${pedidoId}/proposta/${propostaId}`, { acao });
  return data;
}

export async function enviarEndereco(pedidoId, { endereco, lat, lng }) {
  const { data } = await api.put(`/api/pedidos/${pedidoId}/endereco`, { endereco, lat, lng });
  return data;
}

export async function atualizarStatusPedido(pedidoId, status) {
  const { data } = await api.put(`/api/pedidos/${pedidoId}/status`, { status });
  return data;
}
