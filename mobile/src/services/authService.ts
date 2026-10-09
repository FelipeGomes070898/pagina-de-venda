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
  aceiteTermos: boolean;
  // Somente para prestador:
  segmento?: string;
  valorServico?: number;
  modeloCobranca?: ModeloCobranca;
  // Split de pagamento (carteira) — opcionais, usados pra abrir a
  // subconta Asaas do prestador quando disponíveis.
  dataNascimento?: string;
  rendaMensal?: number;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
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

export interface TornarPrestadorPayload {
  segmento: string;
  valorServico?: number;
  modeloCobranca: ModeloCobranca;
}

// Cliente que também quer trabalhar — cria o perfil de prestador
// vinculado à mesma conta (reaproveita nome/e-mail/telefone/CPF/senha),
// sem gerar um segundo login. A resposta já vem pronta pra entrar
// direto no "modo prestador" via authStore.definirSessao.
export async function tornarPrestador(payload: TornarPrestadorPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/me/tornar-prestador', payload);
  return data;
}

// Troca de "modo" (cliente ⇄ prestador) sem deslogar — emite um token
// novo pro papel vinculado na mesma conta.
export async function trocarPapel(): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/me/trocar-papel');
  return data;
}

export interface FotoTrabalho {
  id: string;
  url: string;
  legenda: string | null;
  criado_em: string;
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
  foto_url?: string | null;
  // cliente e prestador têm os dois, mas o sentido da nota é diferente
  // (avaliação QUE o cliente recebeu dos prestadores vs. que o
  // prestador recebeu dos clientes) — nunca se misturam no backend.
  avaliacao?: number;
  total_servicos?: number;
  total_avaliacoes?: number;
  // só em prestador:
  segmento?: string | null;
  valor_servico?: number | null;
  modelo_cobranca?: 'percentual' | 'fixo_mensal';
  status?: 'ativo' | 'inadimplente' | 'bloqueado';
  fotos?: FotoTrabalho[];
  servicos?: { id: string; categoria: string; valor: number | null; descricao?: string | null }[];
  avatarGenero?: 'masculino' | 'feminino' | 'neutro' | null;
  temPapelPrestador?: boolean;
  temPapelCliente?: boolean;
}

export async function meuPerfil(): Promise<MeuPerfil> {
  const { data } = await api.get<MeuPerfil>('/api/auth/me');
  return data;
}

// LGPD "portabilidade" — dados cadastrais do usuário logado.
export async function exportarDados(): Promise<{ tipo: string; exportadoEm: string; dados: unknown }> {
  const { data } = await api.get('/api/auth/me/exportar');
  return data;
}

// LGPD "direito ao esquecimento" — exige a senha atual pra confirmar.
export async function excluirConta(senha: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>('/api/auth/me', { data: { senha } });
  return data;
}
