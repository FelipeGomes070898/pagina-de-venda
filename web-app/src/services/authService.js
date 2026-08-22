import { api } from './api';

export async function login({ identificador, tipoIdentificador, senha }) {
  const { data } = await api.post('/api/auth/login', { identificador, tipoIdentificador, senha });
  return data;
}

export async function cadastro(payload) {
  const { data } = await api.post('/api/auth/cadastro', payload);
  return data;
}
