import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      admin: null,
      token: null,

      login: async (email, senha) => {
        const { data } = await api.post('/auth/admin/login', { email, senha });
        set({ admin: data.admin, token: data.token });
      },

      logout: () => set({ admin: null, token: null }),

      cargo: () => get().admin?.cargo || null,
      isDono: () => get().admin?.cargo === 'dono',
      isRH: () => get().admin?.cargo === 'rh',
      isGerente: () => get().admin?.cargo === 'gerente',
      isAtendimento: () => get().admin?.cargo === 'atendimento',
      podeGerenciarEquipe: () => ['dono', 'rh'].includes(get().admin?.cargo),
      podeVerFinanceiro: () => get().admin?.cargo === 'dono',
    }),
    { name: 'vexo-painel-auth' },
  ),
);
