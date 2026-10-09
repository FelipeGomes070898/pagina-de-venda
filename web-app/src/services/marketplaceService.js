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

// Mapa de trabalhadores disponíveis (tela inicial) — as coordenadas já
// vêm levemente embaralhadas pelo backend, nunca a posição exata.
export async function listarMapaPrestadores(filtros = {}) {
  const { data } = await api.get('/api/prestadores/mapa', { params: filtros });
  return data;
}

export async function definirAvatarPrestador(avatarGenero) {
  const { data } = await api.put('/api/prestadores/me/avatar', { avatarGenero });
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

export async function listarMinhasConversas() {
  const { data } = await api.get('/api/pedidos/meus');
  return data;
}

export async function listarBannersAtivos() {
  const { data } = await api.get('/api/banners/ativos');
  return data;
}

export async function validarCupom(codigo, valorPedido) {
  const { data } = await api.post('/api/cupons/validar', { codigo, valorPedido });
  return data;
}
