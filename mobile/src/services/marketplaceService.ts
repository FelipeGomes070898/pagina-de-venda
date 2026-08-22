import { api } from './api';

export interface Prestador {
  id: string;
  nome: string;
  segmento: string | null;
  valor_servico: number | null;
  cidade: string | null;
  estado: string | null;
  foto_url: string | null;
  status: string;
  modelo_cobranca: 'percentual' | 'fixo_mensal';
  avaliacao: number;
  total_servicos: number;
  total_avaliacoes: number;
  total_fotos_trabalho: number;
  distancia_km: number | null;
}

export interface PrestadorDetalhe extends Prestador {
  bio: string | null;
  fotos: { id: string; url: string; legenda: string | null }[];
  avaliacoes: { id: string; nota: number; comentario: string | null; cliente_nome: string }[];
}

export interface Pedido {
  id: string;
  cliente_id: string;
  prestador_id: string | null;
  descricao: string | null;
  endereco: string | null;
  valor: number | null;
  status: string;
  criado_em: string;
}

export interface FiltrosMarketplace {
  segmento?: string;
  cidade?: string;
  lat?: number;
  lng?: number;
}

export async function listarPrestadores(filtros: FiltrosMarketplace = {}): Promise<Prestador[]> {
  const { data } = await api.get<Prestador[]>('/api/prestadores', { params: filtros });
  return data;
}

export async function buscarPrestador(id: string): Promise<PrestadorDetalhe> {
  const { data } = await api.get<PrestadorDetalhe>(`/api/prestadores/${id}`);
  return data;
}

export async function contatarPrestador(prestadorId: string, descricao?: string): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/api/pedidos', { prestadorId, descricao });
  return data;
}

export async function publicarPedidoAberto(payload: {
  descricao: string;
  valorSugerido?: number;
  segmento?: string;
}): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/api/pedidos/abertos', payload);
  return data;
}

export async function listarPedidosAbertos(): Promise<Pedido[]> {
  const { data } = await api.get<Pedido[]>('/api/pedidos/abertos');
  return data;
}
