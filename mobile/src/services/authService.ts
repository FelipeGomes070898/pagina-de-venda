import { api } from './api';
import { TipoIdentificador } from '@/utils/validators';

export interface Usuario {
  id: string;
  nome: string;
  tipo: 'cliente' | 'prestador' | 'admin' | 'suporte';
  fotoUrl?: string;
  cidade?: string | null;
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

export type TipoConta = 'cliente' | 'prestador';
export type ModeloCobranca = 'percentual' | 'fixo_mensal';

export interface CadastroPayload {
  tipo: TipoConta;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  senha: string;
  cidade?: string;
  estado?: string;
  lat?: number;
  lng?: number;
  googleId?: string;
  // Somente para prestador:
  segmento?: string;
  valorServico?: number;
  modeloCobranca?: ModeloCobranca;
}

export interface PerfilGoogle {
  googleId: string;
  email: string;
  nome: string;
}

export type LoginGoogleResponse =
  | (LoginResponse & { novoCadastro?: false })
  | { novoCadastro: true; perfilGoogle: PerfilGoogle };

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', payload);
  return data;
}

export async function cadastro(payload: CadastroPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/cadastro', payload);
  return data;
}

export interface RecuperarSenhaPayload {
  email: string;
  cpf: string;
  telefone: string;
  senhaNova: string;
}

export async function recuperarSenha(payload: RecuperarSenhaPayload): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>('/api/auth/recuperar-senha', payload);
  return data;
}

export async function loginComGoogle(idToken: string): Promise<LoginGoogleResponse> {
  const { data } = await api.post<LoginGoogleResponse>('/api/auth/google', { idToken });
  return data;
}

export interface MeuPerfil {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade: string | null;
  estado: string | null;
  tipo: 'cliente' | 'prestador';
  // só em prestador:
  segmento?: string | null;
  valor_servico?: number | null;
  modelo_cobranca?: 'percentual' | 'fixo_mensal';
  avaliacao?: number;
  total_servicos?: number;
  total_avaliacoes?: number;
}

export async function meuPerfil(): Promise<MeuPerfil> {
  const { data } = await api.get<MeuPerfil>('/api/auth/me');
  return data;
}
