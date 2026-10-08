import { api } from './api';

export interface ServicoPrestador {
  id: string;
  categoria: string;
  valor: number | null;
  descricao?: string | null;
}

export interface Prestador {
  id: string;
  nome: string;
  whatsapp: string | null;
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
  servicos?: ServicoPrestador[];
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
  pagamento_confirmado_em: string | null;
  pagamento_quando: 'antecipado' | 'apos' | null;
  pagamento_forma: 'app' | 'pix_direto' | null;
  urgente?: boolean;
  taxa_urgencia?: number | null;
  pago_via_carteira?: boolean;
}

export interface Banner {
  id: string;
  titulo: string | null;
  imagem_url: string;
  link_url: string | null;
  ordem: number;
}

export interface CupomValidado {
  codigo: string;
  tipo: 'percentual' | 'fixo';
  valor: number;
  desconto: number;
}

export interface Conversa extends Pedido {
  contraparte_nome: string | null;
}

export interface FiltrosMarketplace {
  segmento?: string;
  busca?: string;
  cidade?: string;
  lat?: number;
  lng?: number;
}

export async function listarPrestadores(filtros: FiltrosMarketplace = {}): Promise<Prestador[]> {
  const { data } = await api.get<Prestador[]>('/api/prestadores', { params: filtros });
  return data;
}

export async function buscarPrestador(
  id: string,
  coordenadas?: { lat?: number; lng?: number } | null,
): Promise<PrestadorDetalhe> {
  const { data } = await api.get<PrestadorDetalhe>(`/api/prestadores/${id}`, {
    params: { lat: coordenadas?.lat, lng: coordenadas?.lng },
  });
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
  urgente?: boolean;
  cupomCodigo?: string;
}): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/api/pedidos/abertos', payload);
  return data;
}

export async function listarBannersAtivos(): Promise<Banner[]> {
  const { data } = await api.get<Banner[]>('/api/banners/ativos');
  return data;
}

export async function validarCupom(codigo: string, valorPedido: number): Promise<CupomValidado> {
  const { data } = await api.post<CupomValidado>('/api/cupons/validar', { codigo, valorPedido });
  return data;
}

export async function listarPedidosAbertos(filtros: FiltrosMarketplace = {}): Promise<Pedido[]> {
  const { data } = await api.get<Pedido[]>('/api/pedidos/abertos', {
    params: { cidade: filtros.cidade, segmento: filtros.segmento },
  });
  return data;
}

// Prestador responde a um pedido em aberto (sem prestador vinculado
// ainda) — equivalente a "entrar em contato", só que partindo dele.
export async function responderPedidoAberto(pedidoId: string): Promise<Pedido> {
  const { data } = await api.post<Pedido>(`/api/pedidos/abertos/${pedidoId}/responder`);
  return data;
}

export type StatusPedido = 'andamento' | 'concluido' | 'cancelado';

export async function atualizarStatusPedido(
  pedidoId: string,
  status: StatusPedido,
): Promise<Pedido> {
  const { data } = await api.put<Pedido>(`/api/pedidos/${pedidoId}/status`, { status });
  return data;
}

export async function listarMinhasConversas(): Promise<Conversa[]> {
  const { data } = await api.get<Conversa[]>('/api/pedidos/meus');
  return data;
}
