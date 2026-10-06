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
  // Fica false até o Zustand terminar de reidratar o AsyncStorage —
  // sem isso, a navegação decide "não autenticado" por uma fração de
  // segundo mesmo pra quem tem login salvo, e pisca a tela de Login
  // antes de ir pra Home.
  hasHydrated: boolean;
  isAuthenticated: () => boolean;
  setLembrarLogin: (valor: boolean) => void;
  login: (payload: LoginPayload) => Promise<void>;
  cadastrar: (payload: CadastroPayload) => Promise<void>;
  definirSessao: (sessao: { token: string; usuario: Usuario }) => void;
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
      hasHydrated: false,

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

      // Usado pelo login com Google: a sessão já vem pronta do backend,
      // sem passar pelas ações login()/cadastrar().
      definirSessao: ({ token, usuario }) => {
        setAuthToken(token);
        set({ token, usuario, erro: null });
      },

      logout: () => {
        setAuthToken(null);
        set({ token: null, usuario: null });
      },
    }),
    {
      name: 'konectaja-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) =>
        state.lembrarLogin
          ? { usuario: state.usuario, token: state.token, lembrarLogin: state.lembrarLogin }
          : { lembrarLogin: state.lembrarLogin },
      // Dois ajustes que só fazem sentido depois que o AsyncStorage
      // termina de carregar o estado salvo:
      // 1. reaplicar o token no header padrão do axios — sem isso, quem
      //    reabre o app com "salvar login" marcado tem o token no
      //    Zustand mas nenhuma chamada autenticada funciona, porque
      //    setAuthToken() só era chamado durante login/cadastro/logout.
      // 2. marcar hasHydrated — a navegação usa isso pra não decidir
      //    "não autenticado" antes da hora e piscar a tela de Login.
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);
