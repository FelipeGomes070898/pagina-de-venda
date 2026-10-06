import axios from 'axios';

// TODO: trocar pro domínio próprio (ex.: api.konectaja.app) quando ele
// existir de verdade — por enquanto aponta pro backend real publicado
// na Vercel (api.konectaja.app nunca foi comprado/configurado).
export const API_URL = 'https://konectaja-backend.vercel.app';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
