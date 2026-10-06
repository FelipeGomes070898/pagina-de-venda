import { api } from './api';

export async function login({ identificador, tipoIdentificador, senha }) {
  const { data } = await api.post('/api/auth/login', { identificador, tipoIdentificador, senha });
  return data;
}

export async function cadastro(payload) {
  const { data } = await api.post('/api/auth/cadastro', payload);
  return data;
}

export async function recuperarSenha({ email, cpf, telefone, senhaNova }) {
  const { data } = await api.post('/api/auth/recuperar-senha', { email, cpf, telefone, senhaNova });
  return data;
}

export async function meuPerfil() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

// Chamado depois que a foto já subiu pro Vercel Blob (ver uploadService.js).
export async function atualizarFotoPerfil(url) {
  const { data } = await api.patch('/api/auth/me/foto', { url });
  return data;
}
