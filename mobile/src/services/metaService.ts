import { api } from './api';

export type TipoMeta = 'semana' | 'mes';

export interface MetaPrestador {
  id: string;
  tipo: TipoMeta;
  quantidade: number;
  progresso: number;
  criado_em: string;
  atualizado_em: string;
}

export async function minhasMetas(): Promise<MetaPrestador[]> {
  const { data } = await api.get('/api/metas');
  return data;
}

export async function definirMeta(payload: { tipo: TipoMeta; quantidade: number }): Promise<MetaPrestador> {
  const { data } = await api.post('/api/metas', payload);
  return data;
}

export async function removerMeta(tipo: TipoMeta): Promise<void> {
  await api.delete(`/api/metas/${tipo}`);
}
