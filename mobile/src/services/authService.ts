import { api } from './api';
import { TipoIdentificador } from '@/utils/validators';

export interface Usuario {
  id: string;
  nome: string;
  tipo: 'cliente' | 'prestador' | 'admin' | 'suporte';
  fotoUrl?: string;
}

export interface LoginPayload {
  identificador: string;
  tipoIdentificador: TipoIdentificador;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', payload);
  return data;
}
