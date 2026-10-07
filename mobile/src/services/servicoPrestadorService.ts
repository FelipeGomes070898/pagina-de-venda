import { api } from './api';
import { ServicoPrestador } from './marketplaceService';

// "Área de serviço": outros trabalhos que o prestador também faz, além
// do segmento principal do cadastro — cada um com sua própria diária.
export async function adicionarServico(payload: {
  categoria: string;
  valor?: number;
  descricao?: string;
}): Promise<ServicoPrestador> {
  const { data } = await api.post<ServicoPrestador>('/api/prestadores/me/servicos', payload);
  return data;
}

export async function removerServico(servicoId: string): Promise<void> {
  await api.delete(`/api/prestadores/me/servicos/${servicoId}`);
}
