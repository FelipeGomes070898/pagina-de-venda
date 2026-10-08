import { api } from './api';

export async function minhasMetas() {
  const { data } = await api.get('/api/metas');
  return data;
}

export async function definirMeta({ tipo, quantidade }) {
  const { data } = await api.post('/api/metas', { tipo, quantidade });
  return data;
}

export async function removerMeta(tipo) {
  await api.delete(`/api/metas/${tipo}`);
}
