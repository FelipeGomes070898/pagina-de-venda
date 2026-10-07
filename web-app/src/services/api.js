import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Sem timeout, uma requisição que trava do lado do servidor (ou numa
// rede instável) fica "Carregando..." pra sempre na tela, sem erro
// nenhum — o usuário não tem como saber que algo deu errado.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
