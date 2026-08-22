import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as authService from '../services/authService';

export const useAuthStore = create()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      lembrarLogin: true,
      carregando: false,
      erro: null,

      isAuthenticated: () => !!get().token,
      setLembrarLogin: (valor) => set({ lembrarLogin: valor }),

      login: async (payload) => {
        set({ carregando: true, erro: null });
        try {
          const { token, usuario } = await authService.login(payload);
          set({ token, usuario, carregando: false });
        } catch (e) {
          set({ carregando: false, erro: 'error_login_failed' });
          throw e;
        }
      },

      cadastrar: async (payload) => {
        set({ carregando: true, erro: null });
        try {
          const { token, usuario } = await authService.cadastro(payload);
          set({ token, usuario, carregando: false });
        } catch (e) {
          set({ carregando: false, erro: 'error_register_failed' });
          throw e;
        }
      },

      logout: () => set({ token: null, usuario: null }),
    }),
    {
      name: 'vexo-web-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        state.lembrarLogin
          ? { usuario: state.usuario, token: state.token, lembrarLogin: state.lembrarLogin }
          : { lembrarLogin: state.lembrarLogin },
    },
  ),
);
