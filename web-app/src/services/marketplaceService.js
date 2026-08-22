import { api } from './api';

export async function listarPrestadores(filtros = {}) {
  const { data } = await api.get('/api/prestadores', { params: filtros });
  return data;
}

export async function buscarPrestador(id) {
  const { data } = await api.get(`/api/prestadores/${id}`);
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

export async function listarPedidosAbertos() {
  const { data } = await api.get('/api/pedidos/abertos');
  return data;
}
