import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '@/services/api';
import * as authService from '@/services/authService';
import { CadastroPayload, LoginPayload, Usuario } from '@/services/authService';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  lembrarLogin: boolean;
  carregando: boolean;
  erro: string | null;
  isAuthenticated: () => boolean;
  setLembrarLogin: (valor: boolean) => void;
  login: (payload: LoginPayload) => Promise<void>;
  cadastrar: (payload: CadastroPayload) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      lembrarLogin: true,
      carregando: false,
      erro: null,

      isAuthenticated: () => !!get().token,

      setLembrarLogin: (valor: boolean) => set({ lembrarLogin: valor }),

      login: async (payload: LoginPayload) => {
        set({ carregando: true, erro: null });
        try {
          const { token, usuario } = await authService.login(payload);
          setAuthToken(token);
          set({ token, usuario, carregando: false });
        } catch (e) {
          set({ carregando: false, erro: 'error_login_failed' });
          throw e;
        }
      },

      cadastrar: async (payload: CadastroPayload) => {
        set({ carregando: true, erro: null });
        try {
          const { token, usuario } = await authService.cadastro(payload);
          setAuthToken(token);
          set({ token, usuario, carregando: false });
        } catch (e) {
          set({ carregando: false, erro: 'error_register_failed' });
          throw e;
        }
      },

      logout: () => {
        setAuthToken(null);
        set({ token: null, usuario: null });
      },
    }),
    {
      name: 'vexo-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) =>
        state.lembrarLogin
          ? { usuario: state.usuario, token: state.token, lembrarLogin: state.lembrarLogin }
          : { lembrarLogin: state.lembrarLogin },
    },
  ),
);
