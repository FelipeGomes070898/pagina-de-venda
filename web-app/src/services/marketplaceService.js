import { api } from './api';

export async function listarPrestadores(filtros = {}) {
  const { data } = await api.get('/api/prestadores', { params: filtros });
  return data;
}

export async function buscarPrestador(id, coordenadas = {}) {
  const { data } = await api.get(`/api/prestadores/${id}`, {
    params: { lat: coordenadas.lat, lng: coordenadas.lng },
  });
  return data;
}

export async function contatarPrestador(prestadorId, descricao) {
  const { data } = await api.post('/api/pedidos', { prestadorId, descricao });
  return data;
}

export async function publicarPedidoAberto(payload) {
  const { data } = await api.post('/api/pedidos/abertos', payload);
  return data;
}

export async function listarPedidosAbertos(filtros = {}) {
  const { data } = await api.get('/api/pedidos/abertos', { params: filtros });
  return data;
}

// Prestador responde a um pedido em aberto (sem prestador vinculado
// ainda) — equivalente a "entrar em contato", só que partindo dele.
export async function responderPedidoAberto(pedidoId) {
  const { data } = await api.post(`/api/pedidos/abertos/${pedidoId}/responder`);
  return data;
}
