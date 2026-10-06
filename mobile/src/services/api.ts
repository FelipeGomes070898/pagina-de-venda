import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// TODO: trocar pro domínio próprio (ex.: api.konectaja.app) quando ele
// existir de verdade — por enquanto aponta pro backend real publicado
// na Vercel (api.konectaja.app nunca foi comprado/configurado).
export const API_URL = 'https://konectaja-backend.vercel.app';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Token expirado/inválido: desloga — o AppNavigator reage à mudança de
// estado e já leva de volta pro Login sozinho (useAuthStore importado
// aqui e authStore importando setAuthToken daqui formam um ciclo, mas
// como só é lido dentro do callback — depois que os dois módulos já
// terminaram de carregar — funciona normalmente).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
